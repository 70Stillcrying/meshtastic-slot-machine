# -*- coding: utf-8 -*-

"""
Meshtastic 多等级抽奖后端服务器 - HTTP 版本

功能:
1. 作为一个 Flask Web 服务器运行
2. 通过 HTTP API 与前端页面通信
3. 连接 Meshtastic 设备，监听消息，更新参与者名单
4. 接收前端的抽奖指令，执行抽奖逻辑
"""

import time
import random
import threading
import json
from collections import Counter
from flask import Flask, jsonify, request
from flask_cors import CORS
from pubsub import pub
import meshtastic
import meshtastic.serial_interface
from meshtastic.protobuf.portnums_pb2 import PortNum
import logging

# --- 基础配置 ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
app = Flask(__name__)

# 添加 CORS 支持 - 允许所有来源
CORS(app)

# --- 抽奖功能配置 ---
LOTTERY_KEYWORD = "我要抽奖"
PRIZE_LEVELS = {
    "一等奖": 1,
    "二等奖": 3,
    "三等奖": 5,
}
lottery_participants = set()
lottery_results = None
lottery_in_progress = False

# --- 统计功能变量 ---
message_counts = Counter()
node_info_map = {}
last_update_time = time.time()

# --- HTTP API 路由 ---

@app.route('/')
def index():
    return jsonify({
        "status": "running",
        "message": "Meshtastic 抽奖后端服务器正在运行！",
        "participants": len(lottery_participants),
        "keyword": LOTTERY_KEYWORD
    })

@app.route('/status')
def status():
    """获取当前状态"""
    participants_list = []
    for pid in lottery_participants:
        participants_list.append({
            "id": pid,
            "name": node_info_map.get(pid, pid)
        })
    
    return jsonify({
        "status": "running",
        "participants": participants_list,
        "participantCount": len(lottery_participants),
        "keyword": LOTTERY_KEYWORD,
        "prizes": PRIZE_LEVELS,
        "inProgress": lottery_in_progress,
        "results": lottery_results,
        "lastUpdate": last_update_time
    })

@app.route('/trigger-draw', methods=['POST'])
def trigger_draw():
    """触发抽奖"""
    global lottery_in_progress, lottery_results
    
    if lottery_in_progress:
        return jsonify({"error": "抽奖已经在进行中"}), 400
    
    if not lottery_participants:
        return jsonify({"error": "没有参与者"}), 400
    
    # 开始抽奖
    lottery_in_progress = True
    lottery_results = None
    
    # 在后台线程中运行抽奖
    threading.Thread(target=run_lottery).start()
    
    return jsonify({"message": "抽奖已开始"})

@app.route('/reset', methods=['POST'])
def reset():
    """重置抽奖状态"""
    global lottery_participants, lottery_results, lottery_in_progress
    
    lottery_participants.clear()
    lottery_results = None
    lottery_in_progress = False
    
    return jsonify({"message": "抽奖状态已重置"})

# --- 抽奖核心逻辑 ---
def run_lottery():
    global lottery_in_progress, lottery_results, lottery_participants, last_update_time
    
    logging.info("="*25)
    logging.info("🎉🎉🎉 多等级抽奖活动开始！ 🎉🎉🎉")
    logging.info("="*25)

    if not lottery_participants:
        logging.warning("😭 可惜，当前没有任何人参与抽奖。")
        lottery_in_progress = False
        return

    remaining_participants = list(lottery_participants)
    random.shuffle(remaining_participants)
    
    logging.info(f"本次共有 {len(remaining_participants)} 位成员参与抽奖！")
    time.sleep(2)  # 模拟抽奖过程

    full_winner_list = {}
    for prize_name, num_winners in PRIZE_LEVELS.items():
        if not remaining_participants:
            logging.info("所有参与者均已中奖！抽奖提前结束。")
            break
        
        winners_to_draw = min(num_winners, len(remaining_participants))
        current_winners_ids = random.sample(remaining_participants, winners_to_draw)
        
        # 记录本轮获奖者
        full_winner_list[prize_name] = []
        for winner_id in current_winners_ids:
            winner_name = node_info_map.get(winner_id, winner_id)
            full_winner_list[prize_name].append({'id': winner_id, 'name': winner_name})
            remaining_participants.remove(winner_id)
    
    logging.info("🎊 所有奖项均已抽取完毕！")
    
    # 更新结果
    lottery_results = full_winner_list
    lottery_in_progress = False
    lottery_participants.clear()  # 清空参与者列表
    last_update_time = time.time()

# --- Meshtastic 逻辑 ---

def on_meshtastic_receive(packet, interface):
    global last_update_time
    
    try:
        sender_id = packet.get('fromId')
        if not sender_id: return

        if 'decoded' in packet:
            decoded = packet['decoded']
            portnum = decoded.get('portnum')

            if portnum == PortNum.Name(PortNum.TEXT_MESSAGE_APP):
                message_text = decoded.get("text", "")
                if message_text:
                    message_counts[sender_id] += 1
                
                if LOTTERY_KEYWORD in message_text and sender_id not in lottery_participants:
                    lottery_participants.add(sender_id)
                    logging.info(f"🎟️  [抽奖登记] '{node_info_map.get(sender_id, sender_id)}' 已成功参与抽奖！")
                    last_update_time = time.time()
            
            elif portnum == PortNum.Name(PortNum.NODEINFO_APP) or 'user' in decoded:
                user_data = decoded.get('user')
                if user_data:
                    node_id, long_name = user_data.get('id'), user_data.get('longName')
                    if node_id and long_name and (node_id not in node_info_map or node_info_map[node_id] != long_name):
                        logging.info(f"📡 节点信息更新: ID: {node_id}, 名称: {long_name}")
                        node_info_map[node_id] = long_name
                        last_update_time = time.time()

    except Exception as e:
        logging.error(f"处理数据包时发生错误: {e}")

def on_meshtastic_connection(interface, topic=pub.AUTO_TOPIC):
    status = topic.getName().split('.')[-1]
    if status == "established":
        logging.info("✅ Meshtastic 设备连接成功！")
    elif status == "lost":
        logging.warning("❌ Meshtastic 设备连接已断开。")

def meshtastic_thread_func():
    logging.info("📡 Meshtastic 监听线程已启动。")
    try:
        pub.subscribe(on_meshtastic_receive, "meshtastic.receive")
        pub.subscribe(on_meshtastic_connection, "meshtastic.connection")
        interface = meshtastic.serial_interface.SerialInterface()
    except Exception as e:
        logging.error(f"Meshtastic 初始化失败: {e}")

if __name__ == '__main__':
    # 在后台线程中启动 Meshtastic 监听
    meshtastic_thread = threading.Thread(target=meshtastic_thread_func, daemon=True)
    meshtastic_thread.start()

    # 启动 Flask 服务器
    logging.info("🚀 启动 HTTP API 服务器")
    logging.info("📱 前端地址: http://localhost:3000")
    logging.info("🔗 后端地址: http://127.0.0.1:5000")
    
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)