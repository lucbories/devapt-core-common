// NPM IMPORTS
import assert from 'assert'

// COMMON IMPORTS
import T                       from '../utils/types'
import Instance                from '../base/instance'
import DistributedMessage      from '../base/distributed_message'
import DistributedMetrics      from '../base/distributed_metrics'
import DistributedLogs         from '../base/distributed_logs'


const context = 'common/base/distributed_instance'



/**
 * Distributed instances base class: enable communication inside a node or between nodes.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 * 
 * @example
* API:
* 		->load():nothing
* 	    ->load_topology_settings(arg_settings):nothing
* 
* 		->send(DistributedMessage|DistributedMetrics|DistributedLogs):boolean
* 
*      ->enable_on_bus(arg_bus):nothing
*      ->disable_on_bus(arg_bus):nothing
* 
* API for messages:
* 		->send_msg(target, payload):boolean
* 		->receive_msg(DistributedMessage):nothing
* 		->enable_msg():nothing
* 		->disable_msg():nothing
* 
* API for metrics:
* 		->send_metrics(type, values):boolean
* 		->receive_metrics(DistributedMetrics):nothing
* 		->enable_metrics():nothing
* 		->disable_metrics():nothing
* 
* API for logs:
* 		->send_logs(ts, level, texts):boolean
* 		->receive_logs(DistributedLogs):nothing
* 		->enable_logs():nothing
* 		->disable_logs():nothing
 * 
 */
export default class DistributedInstance extends Instance
{
	/**
	 * Create a DistributedInstance.
	 * 
	 * @param {string} arg_collection - collection name.
	 * @param {string} arg_name - server name
	 * @param {string} arg_class - server class name
	 * @param {object} arg_settings - plugin settings map
	 * @param {string} arg_log_context - trace context string (optional, default=context).
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_collection, arg_name, arg_class, arg_settings, arg_log_context=context)
	{
		assert( T.isObject(arg_settings.runtime) || (arg_settings.has && arg_settings.has('runtime')), arg_log_context + ':bad runtime instance')
		assert( T.isObject(arg_settings.logger_manager) || (arg_settings.has && arg_settings.has('logger_manager') ), arg_log_context + ':bad logger_manager instance')
		super(arg_collection, arg_class, arg_name, arg_settings, arg_log_context, arg_settings.logger_manager)
		
		/**
		 * Class type flag.
		 * @type {boolean}
		 */
		this.is_distributed_instance = true

		/**
		 * Messages bus instance.
		 * @type {MessageBus}
		 */
		this._msg_bus = undefined

		/**
		 * Metrics messages bus instance.
		 * @type {MessageBus}
		 */
		this._metrics_bus = undefined
		
		/**
		 * Logs messages bus instance.
		 * @type {MessageBus}
		 */
		this._logs_bus = undefined
		
		/**
		 * Bus unsubscribes handlers map.
		 * @type {object}
		 */
		this._bus_unsubscribes = {}

		// DEBUG
		// this.enable_trace()
	}


	
	/**
	 * Load instance settings.
	 * 
	 * @returns {nothing}
	 */
	load()
	{
		// console.log(context + ':load:DistributedInstance')

		super.load()

		// REGISTER BUSES
		if (! this.is_client_runtime)
		{
			this._msg_bus     = this.get_runtime().node.get_msg_bus()
			this._metrics_bus = this.get_runtime().node.get_metrics_bus()
			this._logs_bus    = this.get_runtime().node.get_logs_bus()
		}

		// DEBUG
		// console.log(context + ':load:name=%s this._metrics_bus', this.get_name(), this._metrics_bus.get_name())
	}


	
	/**
	 * Load topology settings.
	 * 
	 * @param {object} arg_settings - master node settings.
	 * 
	 * @returns {nothing}
	 */
	load_topology_settings(arg_settings)
	{
		this.enter_group('load_topology_settings')

		arg_settings = undefined

		this.leave_group('load_topology_settings')
		return arg_settings
	}



	/**
	 * Send a message to an other client.
	 * 
	 * @param {DistributedMessage} arg_msg - message object: a DistributedMessage or DistributedMetrics or DistributedLogs instance.
	 * 
	 * @returns {boolean} - message send or not
	 */
	send(arg_msg)
	{
		assert( T.isObject(arg_msg), context + ':send:bad message object')

		if (this._msg_bus && arg_msg.is_distributed_message)
		{
			this._msg_bus.msg_post(arg_msg)
			return true
		}

		if (this._metrics_bus && arg_msg.is_distributed_metrics)
		{
			this._metrics_bus.msg_post(arg_msg)
			return true
		}
		
		if (this._logs_bus && arg_msg.is_distributed_logs)
		{
			this._logs_bus.msg_post(arg_msg)
			return true
		}

		assert(false, context + ':send:bad message type: not msg or metrics or logs')

		return false
	}


	
	/**
	 * Enable distributed messaging.
	 * 
	 * @param {MessageBus} arg_bus - message bus.
	 * @param {string} arg_channel - channel name string (default='default').
	 * @param {string} arg_method  - receiveing method name string (default='receive_msg').
	 * @param {string} arg_alias   - instance alias name string (optional, default undefined).
	 * 
	 * @returns {nothing}
	 */
	enable_on_bus(arg_bus, arg_channel='default', arg_method='receive_msg', arg_alias=undefined)
	{
		const bus_name = arg_bus.get_name() + ':' + arg_channel
		this._bus_unsubscribes[bus_name] = arg_bus.msg_register(this, arg_channel, arg_method, arg_alias)
	}


	
	/**
	 * Disable distributed messaging.
	 * 
	 * @param {MessageBus} arg_bus - message bus.
	 * @param {string} arg_channel - bus channel string (default='default').
	 * 
	 * @returns {nothing}
	 */
	disable_on_bus(arg_bus, arg_channel='default')
	{
		const bus_name = arg_bus.get_name() + ':' + arg_channel
		const unsubscribe = this._bus_unsubscribes[bus_name]
		if ( T.isFunction(unsubscribe) )
		{
			unsubscribe()
		}
	}



	// -------------------------------- MESSAGES -------------------------------------
	
	/**
	 * Create and send a message to an other client.
	 * 
	 * @param {string} arg_target_name - recipient name.
	 * @param {object} arg_payload - message payload plain object.
	 * @param {string} arg_channel - channel name string (default='default').
	 * 
	 * @returns {boolean} - message send or not.
	 */
	send_msg(arg_target_name, arg_payload, arg_channel)
	{
		// DEBUG
		// this.enable_trace()

		this.enter_group('send_msg')

		let msg = new DistributedMessage(this.get_name(), arg_target_name, arg_payload, arg_channel)
		
		if (this._msg_bus && msg.check_msg_format(msg) )
		{
			this._msg_bus.msg_post(msg)
			this.leave_group('send_msg')
			return true
		}

		this.leave_group('send_msg:bad format')
		return false
	}
	
	
	
	/**
	 * Process received message (to override in sub classes).
	 * 
	 * @param {DistributedMessage} arg_msg - message instance.
	 * 
	 * @returns {nothing}
	 */
	receive_msg(arg_msg)
	{
		this.enter_group('receive_msg')
		// console.log(context + ':receive_msg:from=%s', arg_msg.sender, arg_msg.payload)

		// DO NOT PROCESS MESSAGES FROM SELF
		if (arg_msg.sender == this.get_name())
		{
			this.leave_group('receive_msg:ignore message from itself')
			return
		}

		this.leave_group('receive_msg')
	}


	
	/**
	 * Enable distributed messaging.
	 * 
	 * @returns {nothing}
	 */
	enable_msg()
	{
		this.enable_on_bus(this._msg_bus, 'default', 'receive_msg')
	}


	
	/**
	 * Disable distributed messaging.
	 * 
	 * @returns {nothing}
	 */
	disable_msg()
	{
		this.disable_on_bus(this._msg_bus, 'default')
	}
    
    
	
	// -------------------------------- METRICS -------------------------------------

	/**
	 * Send a metrics message.
	 * 
	 * @param {string} arg_target_name - recipient name.
	 * @param {string} arg_metric_type - type of metrics.
	 * @param {array} arg_metrics - metrics values array.
	 * 
	 * @returns {boolean} - message send or not
	 */
	send_metrics(arg_target_name, arg_metric_type, arg_metrics)
	{
		this.enter_group('send_metrics')
		
		assert( T.isObject(this._metrics_bus), context + ':send_metrics:bad metrics bus object')

		// console.log(context + ':send_metrics:from=%s, to=%s, type=%s', this.get_name(), arg_target_name, arg_metric_type)

		let msg = new DistributedMetrics(this.get_name(), arg_target_name, arg_metric_type, arg_metrics)
		
		if (this._metrics_bus && msg.check_msg_format(msg) )
		{
			this._metrics_bus.msg_post(msg)

			// console.log(context + ':send_metrics:from=%s, to=%s, type=%s', this.get_name(), arg_target_name, arg_metric_type)
			
			this.leave_group('send_metrics')
			return true
		}
		
		console.error(context + ':send_metrics:BAD FORMAT:from=%s, to=%s, type=%s, values=', this.get_name(), arg_target_name, arg_metric_type, arg_metrics)

		this.leave_group('send_metrics:bad format')
		return false
	}
	
	
	
	/**
	 * Process received metrics message (to override in sub classes).
	 * 
	 * @param {DistributedMetrics} arg_msg - metrics message instance.
	 * 
	 * @returns {nothing}
	 */
	receive_metrics(arg_msg)
	{
		this.enter_group('receive_metrics')
		// console.log(context + ':receive_metrics:from=%s', arg_msg.sender, arg_msg.payload)

		// DO NOT PROCESS MESSAGES FROM SELF
		if (arg_msg.sender == this.get_name())
		{
			this.leave_group('receive_metrics:ignore message from itself')
			return
		}

		this.leave_group('receive_metrics')
	}


	
	/**
	 * Enable distributed metrics.
	 * 
	 * @returns {nothing}
	 */
	enable_metrics()
	{
		this.enable_on_bus(this._metrics_bus, 'metrics', 'receive_metrics')
	}


	
	/**
	 * Disable distributed metrics.
	 * 
	 * @returns {nothing}
	 */
	disable_metrics()
	{
		this.disable_on_bus(this._metrics_bus, 'metrics')
	}



	// -------------------------------- LOGS -------------------------------------

	/**
	 * Send a logs message.
	 * 
	 * @param {string} arg_target_name - recipient name.
	 * @param {string} arg_timestamp - logs timestamp string.
	 * @param {string} arg_level - logs level string.
	 * @param {array} arg_values - logs values array.
	 * 
	 * @returns {boolean} - message send or not
	 */
	send_logs(arg_target_name, arg_timestamp, arg_level, arg_values)
	{
		this.enter_group('send_logs')

		let msg = new DistributedLogs(this.get_name(), arg_target_name, arg_timestamp, arg_level, arg_values)
		
		if (this._logs_bus && msg.check_msg_format(msg) )
		{
			this._logs_bus.msg_post(msg)
			this.leave_group('send_logs')
			return true
		}

		this.leave_group('send_logs:bad format')
		return false
	}
	
	
	
	/**
	 * Process received logs message (to override in sub classes).
	 * 
	 * @param {DistributedLogs} arg_msg - logs message instance.
	 * 
	 * @returns {nothing}
	 */
	receive_logs(arg_msg)
	{
		this.enter_group('receive_logs')

		// console.log(context + ':receive_logs:from=%s', arg_msg.sender, arg_msg.payload)

		// DO NOT PROCESS MESSAGES FROM SELF
		if (arg_msg.sender == this.get_name())
		{
			this.leave_group('receive_logs:ignore message from itself')
			return
		}

		this.leave_group('receive_logs')
	}


	
	/**
	 * Enable distributed logs.
	 * 
	 * @returns {nothing}
	 */
	enable_logs()
	{
		this.enable_on_bus(this._logs_bus, 'logs', 'receive_logs')
	}


	
	/**
	 * Disable distributed logs.
	 * 
	 * @returns {nothing}
	 */
	disable_logs()
	{
		this.disable_on_bus(this._logs_bus, 'logs')
	}
}
