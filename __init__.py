from .nodes import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

import os
import folder_paths

WEB_DIRECTORY = os.path.join(os.path.dirname(os.path.realpath(__file__)), "web")

def get_web_directory():
    return WEB_DIRECTORY

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS', 'WEB_DIRECTORY', 'get_web_directory']