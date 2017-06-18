// NPM IMPORTS
import assert from 'assert'

// COMMON IMPORTS
import T from '../../utils/types'
import TopologyDefineItem from './topology_define_item'
import TopologyDefineTenant from './topology_define_tenant'
import TopologyDefineNode from './topology_define_node'
import TopologyDefinePlugin from './topology_define_plugin'


let context = 'common/topology/define/topology_define_world'



/**
 * TopologyDefineWorld class.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 */
export default class TopologyDefineWorld extends TopologyDefineItem
{
	/**
	 * Create a TopologyDefineWorld instance.
	 * @class TopologyDefineWorld
	 * @extends TopologyDefineItem
	 * 
	 * SETTINGS FORMAT:
	 * 	  Object with:
	 * 		"tenants":...,
	 * 		"nodes":...,
	 * 		"plugins":...,
	 * 
	 * 		"security":...,
	 * 
	 * 		"loggers":...,
	 * 		"traces":...
	 * 	
	 * 
	 * @param {string} arg_name - instance name.
	 * @param {Immutable.Map|object} arg_settings - instance settings map.
	 * @param {Runtime} arg_runtime - runtime instance.
	 * @param {LoggerManager} arg_logger_manager - logger manager object.
	 * @param {string} arg_log_context - trace context string.
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_name, arg_settings, arg_runtime, arg_logger_manager, arg_log_context)
	{
		const log_context = arg_log_context ? arg_log_context : context

		if (arg_settings.get)
		{
			arg_settings = arg_settings.set('runtime', arg_runtime)
			arg_settings = arg_settings.set('logger_manager', arg_logger_manager)
		} else {
			arg_settings.runtime = arg_runtime
			arg_settings.logger_manager = arg_logger_manager
		}

		super(arg_name, arg_settings, 'TopologyDefineWorld', log_context)
		
		this.is_topology_define_world = true

		this.topology_type = 'world'
		
		this._runtime = arg_runtime
		assert( T.isObject(this._runtime) && this._runtime.is_server_runtime, context + ':constructor:bad runtime instance')

		this.load_loggers()
		this.load_security()
		
		this.declare_collection('plugins', 'plugin', TopologyDefinePlugin, this.load_plugin.bind(this))
		this.declare_collection('tenants', 'tenant', TopologyDefineTenant)
		this.declare_collection('nodes',   'node',   TopologyDefineNode)
		
		this.info('World is created')
	}



	/**
	 * Load topology world loggers.
	 * 
	 * @returns {Promise}
	 */
	load_loggers()
	{
		this.info('load_loggers')
		
		const loggers_settings = this.get_setting_js('loggers', {})
		const traces_settings = this.get_setting_js('traces', {})
		
		loggers_settings.traces = traces_settings
		const logger_manager = this._runtime.get_logger_manager()
		logger_manager.load(loggers_settings)
		logger_manager.enable_trace()

		this.info('load_loggers:async is resolved with success')
		return Promise.resolve(true)
	}



	/**
	 * Load topology world security.
	 * 
	 * @returns {Promise}
	 */
	load_security()
	{
		this.enter_group('load_security')
		
		const security_settings = this._runtime.get_registry().root.get('security')
		// console.log(security_settings, context + ':load_security:security_settings')
		
		this._runtime.security().load(security_settings)

		this.leave_group('load_security:async is resolved with success')
		return Promise.resolve(true)
	}



	/**
	 * Load rendering plugins.
	 * 
	 * @param {TopologyDefinePlugin} arg_plugin - plugin definition instance.
	 * 
	 * @returns {Promise} - Promise of Plugin instance.
	 */
	load_plugin(arg_plugin)
	{
		this.enter_group('load_plugin')

		assert( T.isObject(arg_plugin) && arg_plugin.is_topology_define_plugin, context + ':load_plugin: bad plugin definition instance²')
		const name = arg_plugin.get_name()
		this.debug('plugin name', name)
		this.debug('plugin type', arg_plugin.topology_plugin_type)

		let promise = undefined
		switch(arg_plugin.topology_plugin_type){
			case 'rendering': {
				assert( T.isObject(arg_plugin) && arg_plugin.is_topology_define_plugin, context + ':load_plugin:bad plugin object for [' + name + ']')
				assert( T.isObject(this._runtime) && this._runtime.is_base_runtime, context + ':load_plugin:bad runtime instance for [' + name + ']' )
				
				promise = arg_plugin.load_rendering_plugin(this._runtime)
				this.leave_group('load_plugin:rendering:async for [' + name + ']')
				return promise
			}
			case 'services': {
				assert( T.isObject(arg_plugin) && arg_plugin.is_topology_define_plugin, context + ':load_plugin:bad plugin object for [' + name + ']')
				assert( T.isObject(this._runtime) && this._runtime.is_base_runtime, context + ':load_plugin:bad runtime instance for [' + name + ']' )
				
				promise = arg_plugin.load_services_plugin(this._runtime)
				this.leave_group('load_plugin:services:async for [' + name + ']')
				return promise
			}
			case '...':{
				this.leave_group('load_plugin:unknow:async for [' + name + ']')
				return Promise.resolve(false)
			}
		}

		this.leave_group('load_plugin:bad plugin type [' + arg_plugin.topology_plugin_type + '] for [' + name + ']')
		return Promise.reject('world.load_plugin:bad plugin type [' + arg_plugin.topology_plugin_type + '] for [' + name + ']')
	}



	/**
	 * Find a Tenant / Application / service.
	 * 
	 * @param {string} arg_tenant_name - tenant name.
	 * //@param {string} arg_env_name - environment name. (TODO)
	 * @param {string} arg_application_name - application name.
	 * @param {string} arg_svc_name - service name.
	 * 
	 * @returns {TopologyDefineService|undefined}
	 */
	find_service(arg_tenant_name, arg_application_name, arg_svc_name)
	{
		const tenant = this.tenant(arg_tenant_name)
		if(! tenant)
		{
			self.error('tenant not found for ' + arg_tenant_name)
			return
		}

		const application = tenant.application(arg_application_name)
		if(! application)
		{
			self.error('application not found for ' + arg_application_name + ' for tenant ' + arg_tenant_name)
			return
		}

		const defined_svc = application.find_resource(arg_svc_name, 'services')
		return defined_svc
	}


	
	/**
	 * Find a Tenant / Application.
	 * 
	 * @param {Credentials} arg_credentials - credentials instance.
	 * 
	 * @returns {TopologyDefineApplication|undefined}
	 */
	find_application_with_credentials(arg_credentials)
	{
		const tenant_name = arg_credentials.get_tenant()
		// const env_name = arg_credentials.get_env()// TODO
		const application_name = arg_credentials.get_application()

		const tenant = this.tenant(tenant_name)
		if(! tenant)
		{
			self.error('tenant not found for ' + tenant_name)
			return
		}

		const application = tenant.application(application_name)
		return application
	}


	
	/**
	 * Find a Tenant / Application / service.
	 * 
	 * @param {Credentials} arg_credentials - credentials instance.
	 * @param {string} arg_resource_name - resource name.
	 * @param {string} arg_resource_type - resource type.
	 * 
	 * @returns {TopologyDefineService|undefined}
	 */
	find_resource_with_credentials(arg_credentials, arg_resource_name, arg_resource_type)
	{
		const tenant_name = arg_credentials.get_tenant()
		// const env_name = arg_credentials.get_env() // TODO
		const application_name = arg_credentials.get_application()

		const tenant = this.tenant(tenant_name)
		if(! tenant)
		{
			self.error('tenant not found for ' + tenant_name)
			return
		}

		const application = tenant.application(application_name)
		if(! application)
		{
			self.error('resource of type ' + arg_resource_type + ' with name ' + arg_resource_name + 'not found for ' + application_name + ' for tenant ' + tenant_name)
			return
		}

		const defined_svc = application.find_resource(arg_resource_name, arg_resource_type)
		return defined_svc
	}


	
	/**
	 * Find a Tenant / Application / service.
	 * 
	 * @param {Credentials} arg_credentials - credentials instance.
	 * @param {string} arg_svc_name - service name.
	 * 
	 * @returns {TopologyDefineService|undefined}
	 */
	find_service_with_credentials(arg_credentials, arg_svc_name)
	{
		return this.find_resource_with_credentials(arg_credentials, arg_svc_name, 'services')
	}
}
