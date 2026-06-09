import re

class StringSplitNode:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "input_string": ("STRING", {"multiline": True, "dynamicPrompts": False}),
                "split_method": (["空行分割", "符号分割"],),
                "split_symbol": ("STRING", {"default": ",", "placeholder": "输入分割符号"}),
                "output_count": ("INT", {"default": 1, "min": 1, "max": 50, "step": 1}),
            },
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("STRING",)
    FUNCTION = "split_string"
    CATEGORY = "utils"
    DESCRIPTION = "按空行或自定义符号分割字符串"
    OUTPUT_NODE = True
    OUTPUT_IS_LIST = (True,)

    def split_string(self, input_string, split_method, split_symbol, output_count):
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
        
        return (result,)

    @classmethod
    def IS_CHANGED(cls, input_string, split_method, split_symbol, output_count):
        return True

NODE_CLASS_MAPPINGS = {
    "StringSplitNode": StringSplitNode
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "StringSplitNode": "String Split"
}