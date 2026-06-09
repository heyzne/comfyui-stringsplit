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
	if (node.outputs.length === count) return; // 数量一致则跳过

	// 保存连接
	const saved = [];
	for (let i = 0; i < node.outputs.length; i++) {
		const out = node.outputs[i];
		if (!out?.links) continue;
		for (const lid of out.links) {
			const link = graph.links[lid];
			if (link) saved.push({ sid: i, tid: link.target_id, ts: link.target_slot });
		}
	}

	// 断连 + 移除
	for (let i = node.outputs.length - 1; i >= 0; i--) {
		if (node.outputs[i]?.links) {
			for (const lid of [...node.outputs[i].links]) graph.removeLink(lid);
		}
	}
	while (node.outputs.length > 0) node.removeOutput(0);

	// 重建
	for (let i = 0; i < count; i++) {
		node.addOutput(`字符串_${i + 1}`, "STRING");
	}

	// 重连
	for (const c of saved) {
		if (c.sid >= count) continue;
		const tn = graph.getNodeById(c.tid);
		if (!tn) continue;
		graph.connect(node.id, c.sid, c.tid, c.ts, "STRING");
	}

	node.setSize(node.computeSize());
	graph.setDirtyCanvas(true, true);
}

app.registerExtension({
	name: "Comfy.Stringsplit",

	async beforeRegisterNodeDef(nodeType, nodeData, app2) {
		if (nodeType.comfyClass !== "StringSplitNode") return;

		// ---- 创建新节点：初始同步到 output_count（默认 1） ----
		const origOnCreated = nodeType.prototype.onNodeCreated;
		nodeType.prototype.onNodeCreated = function () {
			const ret = origOnCreated?.apply(this, arguments);

			// 挂 widget 回调
			const w = this.widgets?.find(w => w.name === "output_count");
			if (w) {
				w._origCb = w.callback;
				w.callback = function (...args) {
					if (w._origCb) w._origCb.apply(this, args);
					setTimeout(() => syncOutputs(this.node || this), 50);
				};
			}

			// 新建节点：从 10 个输出缩减到 output_count（默认 1）
			syncOutputs(this);
			return ret;
		};

		// ---- 保存：只存可见数量的输出 ----
		const origOnSerialize = nodeType.prototype.onSerialize;
		nodeType.prototype.onSerialize = function (o) {
			const ret = origOnSerialize?.apply(this, arguments) || o;
			const count = getOutputCount(this);
			if (o.outputs && o.outputs.length > count) {
				o.outputs.length = count;
			}
			return ret;
		};

		// ---- 加载：覆盖 configure，用保存数恢复输出（在连线恢复之前） ----
		const origConfigure = nodeType.prototype.configure;
		nodeType.prototype.configure = function (info) {
			// 先移除所有输出（onNodeCreated 同步到 1 个了）
			while (this.outputs.length > 0) this.removeOutput(0);

			// 按照保存的输出数重建
			const savedOutputs = info?.outputs || [];
			for (let i = 0; i < savedOutputs.length; i++) {
				const name = savedOutputs[i]?.name || `字符串_${i + 1}`;
				this.addOutput(name, "STRING");
			}

			// 调用原始的 configure（它会恢复 inputs、widgets 等）
			const ret = origConfigure?.apply(this, arguments);
			return ret;
		};
	},
});
