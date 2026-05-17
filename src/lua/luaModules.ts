import tfInit from "./libs/tf/init.lua?raw";
import tfTree from "./libs/tf/tree.lua?raw";
import tfGraph from "./libs/tf/graph.lua?raw";
import tfTable from "./libs/tf/table.lua?raw";
import tfStringx from "./libs/tf/stringx.lua?raw";
import tfItt from "./libs/tf/itt.lua?raw";
import tfMarkdown from "./libs/tf/markdown.lua?raw";
import tfPipeline from "./libs/tf/pipeline.lua?raw";
import tfActions from "./libs/tf/actions.lua?raw";
import tfConsole from "./libs/tf/console.lua?raw";

export const bundledLuaModules: Record<string, string> = {
  tf: tfInit,
  "tf.tree": tfTree,
  "tf.graph": tfGraph,
  "tf.table": tfTable,
  "tf.stringx": tfStringx,
  "tf.itt": tfItt,
  "tf.markdown": tfMarkdown,
  "tf.pipeline": tfPipeline,
  "tf.actions": tfActions,
  "tf.console": tfConsole
};
