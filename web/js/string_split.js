import { app } from "../../../scripts/app.js";

const MAX_OUTPUTS = 10;

function getOutputCount(node) {
	const w = node.widgets?.find(w => w.name === "output_count");
	return Math.max(1, Math.min(MAX_OUTPUTS, parseInt(w?.value) || 1));
}

function syncOutputs(node) {
	const count = getOutputCount(node);
	const graph = app.graph;
	if (!graph || !node.outputs) return;

	// 保存完整的连接信息（目标节点ID + 输入槽位索引）
	const savedConnections = [];
	for (let i = 0; i < node.outputs.length; i++) {
		const out = node.outputs[i];
		if (!out || !out.links) continue;
		for (const linkId of out.links) {
			const link = graph.links[linkId];
			if (link && link.target_id !== undefined) {
				savedConnections.push({
					sourceSlot: i,
					targetNodeId: link.target_id,
					targetSlot: link.target_slot,
				});
			}
		}
	}

	// 先断开所有输出连接（避免 removeOutput 时报错）
	for (let i = node.outputs.length - 1; i >= 0; i--) {
		if (node.outputs[i] && node.outputs[i].links) {
			for (const linkId of [...node.outputs[i].links]) {
				graph.removeLink(linkId);
			}
		}
	}

	// 清除所有输出
	while (node.outputs.length > 0) {
		node.removeOutput(0);
	}

	// 按需创建新输出
	for (let i = 0; i < count; i++) {
		node.addOutput(`字符串_${i + 1}`, "STRING");
	}

	// 恢复连接
	for (const conn of savedConnections) {
		if (conn.sourceSlot < count) {
			const targetNode = graph.getNodeById(conn.targetNodeId);
			if (targetNode) {
				graph.connect(
					conn.sourceSlot,
					node.id,
					conn.targetSlot,
					conn.targetNodeId,
					"STRING"
				);
			}
		}
	}

	graph.setDirtyCanvas(true, true);
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
