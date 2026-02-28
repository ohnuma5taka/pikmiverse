import os
import ssl
import uuid
from time import sleep
from app.core.env import env
from paho.mqtt import client as mqtt_client

from app.models.mqtt_model import MqttData
from app.utils import json_util


class MqttService:
    def __init__(self):
        self.topic = "/pikmiverse"
        self.first_reconnect_delay = 1
        self.reconnect_rate = 2
        self.max_reconnect_count = 12
        self.max_reconnect_delay = 60
        client_id = f"backend-{os.getpid()}-{uuid.uuid4()}"
        self.client = mqtt_client.Client(client_id=client_id)
        self.client.tls_set(
            ca_certs=env.MQTT_CA_CERT,
            certfile=None,
            keyfile=None,
            cert_reqs=ssl.CERT_REQUIRED,
            tls_version=ssl.PROTOCOL_TLS_CLIENT,
        )
        self.client.tls_insecure_set(False)

        def on_connect(client, userdata, flags, rc):
            if rc == 0:
                print("✅ MQTT Connected")
            else:
                print(f"❌ MQTT Failed: {rc}")

        def on_disconnect(client, userdata, rc):
            print(f"切断されました、結果コード: {rc}")
            reconnect_count, reconnect_delay = 0, self.first_reconnect_delay
            while reconnect_count < self.max_reconnect_count:
                print(f"{reconnect_delay}秒後に再接続します...")
                sleep(reconnect_delay)

                try:
                    client.reconnect()
                    print("再接続に成功しました！")
                    return
                except Exception as err:
                    print(f"{err}。再接続に失敗しました。再試行します...")

                reconnect_delay *= self.reconnect_rate
                reconnect_delay = min(reconnect_delay, self.max_reconnect_delay)
                reconnect_count += 1
            print(f"{reconnect_count}回の試行後に再接続に失敗しました。終了します...")

        self.client.on_connect = on_connect
        self.client.on_disconnect = on_disconnect
        self.client.connect(host=env.MQTT_HOST, port=env.MQTT_PORT, keepalive=30)
        self.client.loop_start()

    def publish(self, data: MqttData) -> None:
        if not self.client.is_connected():
            print("❌ MQTT disconnected")
            return
        self.client.publish(
            topic=self.topic, payload=json_util.dumps(data.model_dump())
        )


# mqtt_service = MqttService()
