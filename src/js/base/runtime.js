
// NPM IMPORTS

// COMMON IMPORTS

let _runtime_instance = undefined

export const register_runtime = (arg_runtime)=> {
	_runtime_instance = arg_runtime
}

export const get_runtime = ()=> {
	return _runtime_instance
}

export default _runtime_instance