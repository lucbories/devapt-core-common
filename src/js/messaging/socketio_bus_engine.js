// NPM IMPORTS
import assert from 'assert'
import _ from 'lodash'
import {format} from 'util'
import SocketIOServer from 'socket.io'
import SocketIOClient from 'socket.io-client'

// COMMON IMPORTS
import T        from '../utils/types'
import BusEngine from './bus_engine'


const context = 'common/messaging/socketio_bus_engine'



/**
 * SocketIO based bus engine class for message bus client or server.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 * 
 * @example
* API:
*   ->constructor(arg_name,arg_settings,arg_log_context,arg_logger_manager).
* 
*	->channel_list():array                           - List engine channels.
*   ->channel_add(arg_channel):nothing               - Add a channel.
*   ->channel_send(arg_channel, arg_payload):nothing - Send a message into a channel.
*   ->channel_on(arg_channel, arg_handler):nothing   - Subscribe on channel inputs.
*   ->channel_transform(arg_in_channel, arg_out_channel, arg_xform_handler):nothing - Transform payload of input channel to output channel.
* 
 */
export default class SocketIOBusEngine extends BusEngine
{
	/**
	 * Create a bus.
	 * 
	 * @param {string} arg_name - instance name.
	 * @param {object} arg_settings - settings.
	 * @param {string} arg_log_context - trace context.
	 * @param {LoggerManager} arg_logger_manager - logger manager object (optional).
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_name, arg_settings, arg_log_context=context, arg_logger_manager=undefined)
	{
		super(arg_name, arg_settings, arg_log_context, arg_logger_manager)
		
		/**
		 * Class type flag.
		 * @type {boolean}
		 */
		this.is_socketio_bus_engine = true
		
		this._server = undefined

		if (this._engine_type == 'Server')
		{
			// DEBUG
			this.debug( format('constructor:create a bus server on port=[%s]', this._engine_port) )
			// console.log(context + ':constructor:create a bus server on port=[%s]', this._engine_port)

			this._server = new SocketIOServer(this._engine_port)
			this._server.serveClient(false)
		}

		this._channels = {}
		this._subscribers = {}
	}
	

	
	/**
	 * List engine channels.
	 * 
	 * @returns {array}
	 */
	channel_list()
	{
		return Object.keys(this._channels)
	}
	

	
	/**
	 * Add a channel.
	 * 
	 * @param {string} arg_channel - channel name.
	 * 
	 * @returns {nothing}
	 */
	channel_add(arg_channel)
	{
		assert( T.isString(arg_channel), this.get_context() + ':channel_add:bad channel name')
		
		// SERVER
		if (this._engine_type == 'Server')
		{
			// INIT SERVER NSP
			this._channels[arg_channel] = this._server.of('/' + arg_channel)

			this._channels[arg_channel].on('connect',
				(socket)=>{
					// DEBUG
					this.debug( format('channel_add:on connect:engine=[%s] channel=[%s] id=[%s]', this.get_name(), arg_channel, socket.id) )
					// console.log(context + ':channel_add:on connect:engine=[%s] channel=[%s] id=[%s]', this.get_name(), arg_channel, socket.id)
					
					this.on_connect(socket, arg_channel)
					
					socket.on('error',
						(value)=>
						{
							// DEBUG
							this.debug( format('channel_add:on error:engine=[%s] channel=[%s] id=[%s] value=', this.get_name(), arg_channel, socket.id, value) )
							// console.log(context + ':channel_add:on error:engine=[%s] channel=[%s] id=[%s] value=', this.get_name(), arg_channel, socket.id, value)
							
							this.on_error(socket, arg_channel, value)
						}
					)
					
					socket.on('bus',
						(value)=>{
							// DEBUG
							this.debug( format('channel_add:on bus:engine=[%s] channel=[%s] id=[%s] value=', this.get_name(), arg_channel, socket.id, value) )
							// console.log(context + ':channel_add:on bus:engine=[%s] channel=[%s] id=[%s] value=', this.get_name(), arg_channel, socket.id, value)

							this.on_bus(socket, arg_channel, value)
						}
					)
				}
			)
			
			this._channels[arg_channel].on('disconnect',
				(socket)=>{
					// DEBUG
					this.debug( format('channel_add:on disconnect:engine=[%s] channel=[%s] id=[%s]', this.get_name(), arg_channel, socket.id) )
					// console.log(context + ':channel_add:on disconnect:engine=[%s] channel=[%s] id=[%s]', this.get_name(), arg_channel, socket.id)

					this.on_disconnect(socket, arg_channel)
				}
			)

			return
		}


		// CLIENT
		this._channels[arg_channel] = SocketIOClient(this._engine_url + '/' + arg_channel)

		// CLIENT DEBUG 
		// console.log('this._channels[%s]', arg_channel, this._channels[arg_channel])

		this._channels[arg_channel].on('bus',
			(value)=>{
				// DEBUG
				this.debug( format('channel_add:on bus:engine=[%s] channel=[%s] id=[%s]', this.get_name(), arg_channel, this._channels[arg_channel].id) )
				// console.log(context + ':channel_add:on bus:engine=[%s] channel=[%s] id=[%s]', this.get_name(), arg_channel, this._channels[arg_channel].id)

				this.on_bus(this._channels[arg_channel], arg_channel, value)
			}
		)
	}



	/**
	 * Send a message into a channel.
	 * 
	 * @param {string} arg_channel - channel name string.
	 * @param {object} arg_payload - payload data object.
	 * 
	 * @returns {nothing}
	 */
	channel_send(arg_channel, arg_payload)
	{
		assert( T.isString(arg_channel), this.get_context() + ':channel_send:bad channel name')
		assert( arg_payload, this.get_context() + ':channel_send:bad payload data')
		assert( arg_channel in this._channels, this.get_context() + ':channel_send:channel [' + arg_channel + '] stream not found')
		
		this._channels[arg_channel].emit('bus', arg_payload)
	}
	
	
	
	/**
	 * Subscribe on channel inputs.
	 * 
	 * @param {string} arg_channel - channel name string.
	 * @param {function} arg_handler - f(payload):nothing
	 * @param {function} arg_predicate - p(payload):boolean
	 * 
	 * @returns {nothing}
	 */
	channel_on(arg_channel, arg_handler, arg_predicate=undefined)
	{
		assert( T.isString(arg_channel), this.get_context() + ':channel_on:bad channel name on engine [' + this.get_name() + ']')
		assert( T.isFunction(arg_handler), this.get_context() + ':channel_on:bad handler function on engine [' + this.get_name() + '] for channel [' + arg_channel + ']')
		assert( arg_channel in this._channels, this.get_context() + ':channel_on:channel [' + arg_channel + '] stream not found on engine [' + this.get_name() + ']')
		
		// DEBUG
		this.debug( format('channel_on:bus[' + this.get_name() + '] channel [' + arg_channel + '] predicate=[%s]', arg_predicate ? arg_predicate.toString() : '') )
		// console.log(context + ':channel_on:bus[' + this.get_name() + '] channel [' + arg_channel + ']')

		const handler = (value) => {
			// DEBUG
			this.debug( format('channel_on:bus=[' + this.get_name() + '] channel=[' + arg_channel + '] received value=', value) )
			// console.log(context + ':channel_on:bus=[' + this.get_name() + '] channel=[' + arg_channel + '] received value=', value)
			
			// FILTER BY PREDICATE
			if ( T.isFunction(arg_predicate) )
			{
				if ( arg_predicate(value) )
				{
					arg_handler(value)
					return
				}
			}
			
			// NO VALID PREDICATE
			arg_handler(value)
		}
		
		if (! (arg_channel in this._subscribers) )
		{
			this._subscribers[arg_channel] = []
		}
		this._subscribers[arg_channel].push(handler)

	}

	on_connect(arg_socket, arg_channel)
	{
		//
	}

	on_disconnect(arg_socket, arg_channel)
	{
		//
	}

	on_error(arg_socket, arg_channel, arg_value)
	{
		//
	}

	on_bus(arg_socket, arg_channel, arg_value)
	{
		_.forEach(
			this._subscribers[arg_channel],
			(arg_handler)=>{
				arg_handler(arg_value)
			}
		)
	}
}