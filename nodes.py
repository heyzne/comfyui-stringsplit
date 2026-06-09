import re

class StringSplitNode:
    MAX_OUTPUTS = 50
    RETURN_TYPES = tuple(["STRING"] * MAX_OUTPUTS)
    RETURN_NAMES = tuple([f"STRING_{i+1}" for i in range(MAX_OUTPUTS)])

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "input_string": ("STRING", {"multiline": True, "dynamicPrompts": False}),
                "split_method": (["空行分割", "符号分割"],),
                "split_symbol": ("STRING", {"default": ",", "placeholder": "输入分割符号"}),
                "output_count": ("INT", {"default": 4, "min": 1, "max": cls.MAX_OUTPUTS, "step": 1}),
            },
        }

    FUNCTION = "split_string"
    CATEGORY = "utils"
    DESCRIPTION = "按空行或自定义符号分割字符串"

    def __init__(self):
        self.output_count = 4

    def split_string(self, input_string, split_method, split_symbol, output_count):
        self.output_count = output_count
        
        parts = []
        
        if split_method == "空行分割":
            parts = re.split(r'\n\s*\n', input_string.strip())
            parts = [p.strip() for p in parts if p.strip()]
        else:
            parts = re.split(re.escape(split_symbol), input_string)
            parts = [p.strip() for p in parts if p.strip()]
        
        result = []
        for i in range(output_count):
            if i < len(parts):
                result.append(parts[i])
            else:
                result.append("")
        
        return tuple(result)

    @classmethod
    def IS_CHANGED(cls, input_string, split_method, split_symbol, output_count):
        return True

    @classmethod
    def get_return_types(cls):
        return tuple(["STRING"] * cls.MAX_OUTPUTS)

    @classmethod
    def get_return_names(cls):
        return tuple([f"STRING_{i+1}" for i in range(cls.MAX_OUTPUTS)])

NODE_CLASS_MAPPINGS = {
    "StringSplitNode": StringSplitNode
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "StringSplitNode": "String Split"
}