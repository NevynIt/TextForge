local M = {}

function M.run(id, value)
  return __tf_pipeline_run(id, value)
end

return M
