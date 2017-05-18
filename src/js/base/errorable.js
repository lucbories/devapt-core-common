// COMMON IMPORTS
import Loggable from './loggable'


let context = 'common/base/errorable'



/**
 * Base class to deal with errors.
 * @abstract
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 */
export default class Errorable extends Loggable
{
	/**
	 * Create an Errorable instance.
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
		
		/**
		 * Has error flag (default false).
		 * @type {boolean}
		 */
		this._has_error = false

		/**
		 * Error text (default null).
		 * @type {string}
		 */
		this._error_msg = null
	}
	
	
	/**
	 * Set an error.
	 * @param {string} arg_msg - error message
	 * @returns {nothing}
	 */
	error(arg_msg)
	{
		this._has_error = true
		this._error_msg = arg_msg
		super.error(arg_msg)
	}
	
	
	/**
	 * Test is an error is set.
	 * @returns {boolean}
	 */
	has_error()
	{
		return this._has_error
	}
	
	
	/**
	 * Get error message.
	 * @returns {string}
	 */
	get_error_msg()
	{
		return this._error_msg
	}
    
    
	/**
	 * Default helper for "not implemented" error.
	 */
	error_not_implemented()
	{
		this.error('should be implemented')
	}
}