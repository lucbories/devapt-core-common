// COMMON IMPORTS
import TopologyRegistry from './topology_registry'
import runtime from '../../base/runtime'


const logger_manager = runtime ? runtime.get_logger_manager() : undefined


// CREATE DEFAULT RUNTIME STORE
export const store = new TopologyRegistry(logger_manager, true)
export default store