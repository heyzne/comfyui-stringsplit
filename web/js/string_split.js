import { app } from "../../../scripts/app.js";

const MAX_OUTPUTS = 10;

function getOutputCount(node) {
	const w = node.widgets?.find(w => w.name === "output_count");
	return Math.max(1, Math.min(MAX_OUTPUTS, parseInt(w?.value) || 1));
}

function syncOutputs(node) {
	const count = getOutputCount(node);

	// 保存现有连接
	const savedLinks = {};
	if (node.outputs) {
		for (let i = 0; i < node.outputs.length; i++) {
			if (node.outputs[i] && node.outputs[i].links) {
				savedLinks[i] = [...node.outputs[i].links];
			}
		}
	}

	// 清除所有现有输出
	while (node.outputs && node.outputs.length > 0) {
		node.removeOutput(0);
	}

	// 按需创建新输出
	for (let i = 0; i < count; i++) {
		node.addOutput(`字符串_${i + 1}`, "STRING");
	}

	// 恢复连接（只恢复 count 范围内的）
	if (app.graph) {
		for (let i = 0; i < count; i++) {
			if (savedLinks[i]) {
				node.outputs[i].links = savedLinks[i];
			}
		}
		app.graph.setDirtyCanvas(true, true);
	}
}

app.registerExtension({
	name: "Comfy.Stringsplit",

	async beforeRegisterNodeDef(nodeType, nodeData, app2) {
		if (nodeType.comfyClass === "StringSplitNode") {

			const origOnCreated = nodeType.prototype.onNodeCreated;
			nodeType.prototype.onNodeCreated = function () {
				const ret = origOnCreated?.apply(this, arguments);
				syncOutputs(this);

				const w = this.widgets?.find(w => w.name === "output_count");
				if (w) {
					w._origCb = w.callback;
					w.callback = function (...args) {
						if (w._origCb) w._origCb.apply(this, args);
						setTimeout(() => syncOutputs(this.node || this), 10);
					};
				}
				return ret;
			};

			const origOnConfig = nodeType.prototype.onConfigure;
			nodeType.prototype.onConfigure = function () {
				const ret = origOnConfig?.apply(this, arguments);
				syncOutputs(this);
				return ret;
			};

			const origOnExecuted = nodeType.prototype.onExecuted;
			nodeType.prototype.onExecuted = function () {
				const ret = origOnExecuted?.apply(this, arguments);
				syncOutputs(this);
				return ret;
			};
		}
	},
});
