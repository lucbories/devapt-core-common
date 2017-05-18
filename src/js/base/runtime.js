
// NPM IMPORTS

// COMMON IMPORTS



/**
 * Global runtime singleton.
 * @type {Runtime}
 */
let _runtime_instance = undefined



/**
 * Register singleton runtime instance.
 * 
 * @param {Runtime} arg_runtime - Runtime singleton.
 * 
 * @returns {nothing}
 */
export const register_runtime = (arg_runtime)=> {
	_runtime_instance = arg_runtime
}



/**
 * Get singleton runtime instance.
 * 
 * @returns {Runtime} - Runtime singleton.
 */
export const get_runtime = ()=> {
	return _runtime_instance
}



export default _runtime_instance