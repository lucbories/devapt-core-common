// NPM IMPORTS
import assert from 'assert'

// COMMON IMPORTS
import T                      from '../utils/types'
import Settingsable           from './settingsable'
import LoggerManager          from '../loggers/logger_manager'


/**
 * Contextual constant for this file logs.
 * @private
 */
let context = 'browser/runtime'



/**
 * Base class for runtime - main library interface.
 * @abstract
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 */
export default class RuntimeBase extends Settingsable
{
	/**
	 * Create Runtime base instance.
	 * 
	 * @param {string} arg_log_context - logging context.
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_log_context)
	{
		// INIT LOGGING FEATURE
		const log_context = arg_log_context ? arg_log_context : context
		const loggers_settings = undefined
		const logger_manager = new LoggerManager(undefined, loggers_settings)
		
		super({}, log_context, logger_manager)
		logger_manager._runtime = this

		/**
		 * Class type flag.
		 * @type {boolean}
		 */
		this.is_base_runtime = true

		/**
		 * Runtime state (defautl undefined).
		 * @type {object}
		 */
		this.current_state = undefined

		/**
		 * Runtime state store (defautl undefined).
		 * @type {object}
		 */
		this._state_store = undefined
		
		if ( ! this.is_server_runtime )
		{
			this.update_trace_enabled()
		}
		
		this.info('Runtime is created')
	}
	
	
	
	/**
	 * Get runtime logger manager.
	 * 
	 * @returns {LoggerManager}
	 */
	get_logger_manager()
	{
		return this._logger_manager
	}
	
	
	
	/**
	 * Get state store, a Redux data store.
	 * 
	 * @returns {object} - Redux state store.
	 */
	get_state_store()
	{
		assert( T.isObject(this._state_store), context + ':get_state_store:bad state_store object')
		return this._state_store
	}
	
	
	
	/**
	 * Get store reducers.
	 * 
	 * @returns {function} - reducer pure function: (previous state, action) => new state
	 */
	get_store_reducers()
	{
		return (arg_previous_state, arg_action) => {
			console.info(context + ':get_store_reducers:type=' + arg_action.type)
			
			return arg_previous_state
		}
	}
	
	
	
	/**
	 * Handle Redux store changes.
	 * @returns {nothing}
	 */
	handle_store_change()
	{
		// let previous_state = this.current_state
		// this.current_state = this._state_store.get_state()
		
		/// TODO
		
		// console.info(context + ':handle_store_change:global')
	}
}
