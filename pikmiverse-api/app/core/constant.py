from typing import Dict, Any, List

TARGET_SCORE = 15
POOR_LIGHT_SCORE = 50
SUBMIT_UNIT_SCORE = 5

base_team = {"score": {}, "cleared": False, "next_submit_score": SUBMIT_UNIT_SCORE}
team_map: Dict[str, Dict[str, Any]] = {
    "A": {"device": 1, "easy": False, **base_team},
    "B": {"device": 2, "easy": False, **base_team},
    "C": {"device": 3, "easy": True, **base_team},
    "D": {"device": 4, "easy": False, **base_team},
    "E": {"device": 5, "easy": False, **base_team},
    "F": {"device": 6, "easy": False, **base_team},
    "G": {"device": 7, "easy": False, **base_team},
    "H": {"device": 8, "easy": False, **base_team},
    "I": {"device": 9, "easy": False, **base_team},
    "J": {"device": 10, "easy": False, **base_team},
    "K": {"device": 11, "easy": False, **base_team},
    "L": {"device": 12, "easy": False, **base_team},
    "M": {"device": 13, "easy": False, **base_team},
    "N": {"device": 14, "easy": False, **base_team},
    "O": {"device": 15, "easy": False, **base_team},
    "P": {"device": 16, "easy": False, **base_team},
}

devices = [x["device"] for x in team_map.values()]
pikmiverse_command_map: Dict[str, Dict[str, Any]] = {
    "turn_off_all": {"devices": devices, "action": "off", "parts": ["arm", "edge"]},
    "open_all": {"devices": devices, "action": "open"},
    "white_static_all": {
        "devices": devices,
        "action": "on",
        "parts": ["arm"],
        "color": "#ffffff",
        "type": "static",
    },
    "rainbow_sparkle_all": {
        "devices": devices,
        "action": "on",
        "parts": ["arm"],
        "color": "rainbow",
        "type": "sparkle",
    },
    "purple_sparkle_odd": {
        "devices": [x for x in devices if x <= 8],
        "action": "on",
        "parts": ["arm"],
        "color": "#874da1",
        "type": "sparkle",
    },
    "pink_sparkle_even": {
        "devices": [x for x in devices if x >= 9],
        "action": "on",
        "parts": ["arm"],
        "color": "#ff59ac",
        "type": "sparkle",
    },
    "static_white_value": {
        "devices": [],  # 動的
        "action": "on",
        "parts": ["arm"],
        "color": "#ffffff",
        "type": "static",
        "value": 0,  # 動的
    },
    "blink_rainbow_edge": {
        "devices": [],  # 動的
        "action": "on",
        "parts": ["edge"],
        "color": "rainbow",
        "type": "blink",
    },
}

poor_light_unit = 5
poor_light_count = POOR_LIGHT_SCORE // poor_light_unit
pikmiverse_poor_light_commands: List[Dict[str, Any]] = [
    {
        "commands": [
            {
                "devices": devices,
                "action": "on",
                "parts": ["arm"],
                "color": "#ffffff",
                "type": "static",
                "value": x * poor_light_unit / TARGET_SCORE,
            }
            for x in range(poor_light_count)
        ],
        "command_delay": 0.3,
        "delay": 0.5,
    },
    {
        "commands": sum(
            [
                [
                    {"devices": devices, "action": "off", "parts": ["arm"]},
                    {
                        "devices": devices,
                        "action": "on",
                        "parts": ["arm"],
                        "color": "#ffffff",
                        "type": "static",
                        "value": POOR_LIGHT_SCORE / TARGET_SCORE,
                    },
                ]
                for x in range(3)
            ],
            [],
        ),
        "command_delay": 0.5,
        "delay": 2,
    },
    {
        "commands": [
            {
                "devices": devices,
                "action": "on",
                "parts": ["arm"],
                "color": "#ffffff",
                "type": "static",
                "value": (poor_light_count - x - 1) / TARGET_SCORE,
            }
            for x in range(poor_light_count)
        ],
        "command_delay": 0.3,
        "delay": 0,
    },
]
