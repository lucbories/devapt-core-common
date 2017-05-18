// NPM IMPORTS
import assert from 'assert'

// COMMON IMPORTS
import T        from '../utils/types'
import Loggable from '../base/loggable'


let context = 'common/state_store/store'



/**
 * Base class to deal with state storing and mutations.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 */
export default class StateStore extends Loggable
{
	/**
	 * Create a state Store instance.
	 * 
	 * @param {string} arg_log_context - trace context.
	 * @param {LoggerManager} arg_logger_manager - logger manager object (optional).
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_log_context, arg_logger_manager)
	{
		const my_context = arg_log_context ? arg_log_context : context
		super(my_context, arg_logger_manager)

		this.is_mutable = true
		this.use_immutable = false
	}
	
	

	/**
	 * Get current state.
	 * @abstract
	 * 
	 * @returns {object}
	 */
	get_state()
	{
		return {}
	}
	

	
	/**
	 * Set/Replace current state.
	 * @abstract
	 * 
	 * @param {object} arg_state - new state.
	 * 
	 * @returns {nothing}
	 */
	/* eslint no-unused-vars: "off" */
	set_state(arg_state)
	{
	}
	
	
	
	/**
	 * Dispatch a requested action to mutate current state.
	 * @abstract
	 * 
	 * @param {object} arg_action - action record: { type:'...', ... }.
	 * 
	 * @returns {nothing}
	 */
	/* eslint no-unused-vars: "off" */
	dispatch(arg_action)
	{
	}
	
	
	
	/**
	 * Dispatch a state action.
	 * 
	 * @param {object} arg_action - action object with a 'type' attribute.
	 * 
	 * @returns {nothing}
	 */
	dispatch_action(arg_action)
	{
		assert( T.isObject(arg_action) && T.isString(arg_action.type), context + ':dispatch_action:bad action object')
		this.dispatch(arg_action)		
	}

	
	
	/**
	 * Register a handle on state mutations.
	 * @abstract
	 * 
	 * @param {function} arg_handle - state changes handle as f(old_state, new_state).
	 * 
	 * @returns {function} - unsubscribe function
	 */
	/* eslint no-unused-vars: "off" */
	subscribe(arg_handle)
	{
	}
}