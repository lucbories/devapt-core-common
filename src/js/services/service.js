// NPM IMPORTS
import assert from 'assert'

// COMMON IMPORTS
import T                    from '../utils/types'
import Instance             from '../base/instance'
import Collection           from '../base/collection'
import ServiceActivator     from './service_activator'
import ServiceProvider      from './service_provider'
import ServiceConsumerByUrl from './service_consumer_by_url'


let context = 'common/services'



// STATUS CONSTANTS
// unknow -> created -> enabled -> disabled -> enabled
const STATUS_UNKNOW = 'unknow'
const STATUS_ERROR = 'error'
const STATUS_CREATED = 'created'
const STATUS_ENABLED = 'enabled'
const STATUS_DISABLED = 'disabled'



/**
 * Service base class.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 * 
 * @example
* 	API:
* 		->is_unknow():boolean - STATUS_UNKNOW ?
* 		->is_error():boolean - STATUS_ERROR ?
* 		->is_created():boolean - STATUS_CREATED ?
* 		->is_enabled():boolean - STATUS_ENABLED ?
* 		->is_disabled():boolean - STATUS_DISABLED ?
* 
* 		->enable():boolean - Enable service.
* 		->disable():boolean - Disable service.
* 
* 		->activate(arg_application, arg_app_svc_cfg):nothing - Activate a service feature for an application.
* 		->activate_on_server(arg_application, arg_server, arg_app_svc_cfg):nothing - Activate a service feature for an application on a server.
* 
* 		->get_providers():Collection - Get service providers.
* 		->get_a_provider(arg_strategy):ServiceProvider|null - Get one service provider corresponding to the given strategy.
* 		->get_provider_by_app_server(arg_app_name, arg_server_name):ServiceProvider|null - Get one service provider corresponding to the given application and server.
* 		->create_provider(arg_name, arg_service):ServiceProvider - Create a new ServiceProvider instance for this service.
* 		->create_consumer():ServiceConsumer - Create a new ServiceConsumer instance.
* 		->provider(arg_name):ServiceProvider - Get a service provider by its name.
* 
* 		->get_topology_info(arg_deep=true, arg_visited={}):object - Get topology item informations.
* 		->get_assets_services_names(arg_region='any'):object - Get assets services names.
* 
 */
export default class Service extends Instance
{
	// STATIC CONST ACCESSORS
	static STATUS_UNKNOW()   { return STATUS_UNKNOW }
	static STATUS_ERROR()	 { return STATUS_ERROR }
	static STATUS_CREATED()  { return STATUS_CREATED }
	static STATUS_ENABLED()  { return STATUS_ENABLED }
	static STATUS_DISABLED() { return STATUS_DISABLED }
	
	
	
	/**
	 * Create a service instance.
	 * 
	 * @param {string} arg_name - plugin name
	 * @param {object} arg_settings - plugin settings map
	 * @param {string} arg_log_context - trace context string.
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_svc_name, arg_settings, arg_log_context)
	{
		super('services', 'Service', arg_svc_name, arg_settings, arg_log_context ? arg_log_context : context)
		
		this.status = STATUS_UNKNOW
		
		/**
		 * Class type flag.
		 * @type {boolean}
		 */
		this.is_service = true
		
		/**
		 * Service status.
		 * @type {string}
		 */
		this.status = Service.STATUS_CREATED

		this._activator = new ServiceActivator(this)
		this._providers = new Collection()
	}
	
	
	// STATUS TEST
	is_unknow()   { return this.status === STATUS_UNKNOW }
	is_error()	  { return this.status === STATUS_ERROR }
	is_created()  { return this.status === STATUS_CREATED }
	is_enabled()  { return this.status === STATUS_ENABLED }
	is_disabled() { return this.status === STATUS_DISABLED }
	
	
	
	/**
	 * Enable service.
	 * 
	 * @returns {boolean}
	 */
	enable()
	{
		if (this.is_unknow() || this.is_error() || this.is_enabled())
		{
			return false
		}
		
		this.status = Service.STATUS_ENABLED
		return true
	}
	
	
	
	/**
	 * Disable service.
	 * 
	 * @returns {boolean}
	 */
	disable()
	{
		if (this.is_unknow() || this.is_error() || this.is_disabled())
		{
			return false
		}
		
		this.status = Service.STATUS_DISABLED
		return true
	}
	
	
	
	/**
	 * Activate a service feature for an application.
	 * 
	 * @param {Application} arg_application - Application instance.
	 * @param {object} arg_app_svc_cfg - service configuration on application.
	 * 
	 * @returns {nothing}
	 */
	activate(arg_application, arg_app_svc_cfg)
	{
		// console.log(arg_app_svc_cfg, context + ':arg_app_svc_cfg')
		assert( T.isObject(arg_application) && arg_application.is_topology_define_application , context + ':bad application object')
		assert( T.isObject(arg_app_svc_cfg) , context + ':bad app svc settings object')
		assert( T.isArray(arg_app_svc_cfg.servers), context + ':bad app svc servers array')
		// this.info('servers ' + arg_app_svc_cfg.servers.length)
		
		for(let i in arg_app_svc_cfg.servers)
		{
			const server_name = arg_app_svc_cfg.servers[i]
			assert(T.isString(server_name), context + ':bad server name string')
			this.info('activate on server:' + server_name)
			
			const server = this.get_runtime().node.get_servers().find_by_name(server_name)
			if ( T.isObject(server) )
			{
				// this.activate_on_server(arg_application, server, arg_app_svc_cfg)

				// TODO
				server.use_service_on_loading(arg_application, this, arg_app_svc_cfg)
			}
			else
			{
				this.info('server_name not found ' + server_name)
			}
		}
	}
	
	

	/**
	 * Activate a service feature for an application on a server.
	 * 
	 * @param {Application} arg_application - Application instance.
	 * @param {Server} arg_server - Server instance.
	 * 
	 * @returns {nothing}
	 */
	activate_on_server(arg_application, arg_server)
	{
		assert( T.isObject(arg_application) && arg_application.is_topology_define_application , context + ':bad application object')
		assert( T.isObject(arg_server) && arg_server.is_server , context + ':bad server object')
		
		this.info('activate_on_server [' + arg_server.get_name() + '] for application [' + arg_application.get_name() + ']')
		
		let provider = this.get_provider_by_app_server(arg_application.get_name(), arg_server.get_name())
		
		this._activator.activate(provider, arg_application, arg_server)
	}
	

	
	/**
	 * Get service providers.
	 * 
	 * @returns {Collection}
	 */
	get_providers()
	{
		return this._providers
	}
	

	
	/**
	 * Get one service provider corresponding to the given strategy.
	 * 
	 * @param {object} arg_strategy - search stratgey (TODO).
	 * 
	 * @returns {ServiceProvider|null} - found service provider or null
	 */
	get_a_provider(arg_strategy)
	{
		let provider = null
		
		if (! arg_strategy)
		{
			// USE THE FIRST ITEM OF THE LIST OR THE WEAKED LIST IF ENABLED
			provider = this._providers.get_first()
		}
		
		// TODO: define metrics on the provider and update the weak at each turn
		// TODO: define Strategy class with: bablance, round
		
		if (! provider)
		{
			// const key = 'app' + '-' + 'name'
			// provider = this.create_provider(this.get_name() + '_provider_for_' + key, this)
			// this._providers.add(provider)
		}
		
		return provider
	}
	
	
	
	/**
	 * Get one service provider corresponding to the given application and server.
	 * 
	 * @param {string} arg_app_name - application name.
	 * @param {string} arg_server_name - server name.
	 * 
	 * @returns {ServiceProvider|null} - found service provider or null
	 */
	get_provider_by_app_server(arg_app_name, arg_server_name)
	{
		const key = arg_app_name + '-' + arg_server_name
		let provider = this._providers.find_by_attr('application_server', key)
		assert(! provider, context + ':service provider already activated')
		
		if (! provider)
		{
			provider = this.create_provider(this.get_name() + '_provider_for_' + key, this)
			this._providers.add(provider)
		}
		
		return provider
	}
	
	
	
	/**
	 * Create a new ServiceProvider instance for this service.
	 * 
	 * @param {string} arg_name - instance name.
	 * @param {Service} arg_service - service instance.
	 * 
	 * @returns {ServiceProvider} - created service provider.
	 */
	create_provider(arg_name, arg_service)
	{
		const provider_class = this.get_setting('provider_class', ServiceProvider)
		return new provider_class(arg_name, arg_service)
	}
	

	
	/**
	 * Create a new ServiceConsumer instance.
	 * 
	 * @returns {ServiceConsumer} - created service consumer.
	 */
	create_consumer()
	{
		const consumer_name  = this.get_name() + '_consumer_' + this.get_id()
		const consumer_class = this.get_setting('consumer_class', ServiceConsumerByUrl)
		return new consumer_class(consumer_name, this)
	}

	
	
	/**
	 * Get a service provider by its name.
	 * 
	 * @param {string} arg_name - service provider name.
	 * 
	 * @returns {ServiceProvider}
	 */
	provider(arg_name)
	{
		return this._providers.item(arg_name)
	}



	/**
	 * Get topology item informations.
	 * 
	 * @param {boolean} arg_deep - get deep sub items information on true (default:false).
	 * @param {object} arg_visited - visited items plain object map.
	 * 
	 * @returns {object} - topology informations (plain object).
	 */
	get_topology_info(arg_deep=true, arg_visited={})
	{
		const info = {
			name:this.get_name(),
			uid_desc:'N/A',
			uid:'N/A',

			tenant:'N/A',
			package:'N/A',
			version:'N/A',
			
			type:'service',
			security:'N/A',
			
			children:['N/A']
		}

		if ( arg_visited && (this.topology_uid in arg_visited) )
		{
			return Object.assign(info, { note:'already dumped' } )
		}

		arg_visited[this.topology_uid] = info

		return info
	}



	/**
	 * Get assets services names.
	 * 
	 * @param {string} arg_region - region name.
	 * 
	 * @returns {object} - assets { style:'', script:'', image:'', html:'' }
	 */
	get_assets_services_names(arg_region='any')
	{
		assert( T.isString(arg_region), context + ':get_assets_services_names:bad region string')

		// GET ASSETS CONFIG
		const assets = this.topology_deploy_assets
		const assets_region = arg_region == 'any' ? 'all' : arg_region
		const assets_for_region = T.isObject(assets) && T.isObject(assets[assets_region]) ? assets[assets_region] : undefined
		
		const assets_style  = T.isObject(assets_for_region) && T.isArray(assets_for_region.style)  ? assets_for_region.style  : []
		const assets_script = T.isObject(assets_for_region) && T.isArray(assets_for_region.script) ? assets_for_region.script : []
		const assets_image  = T.isObject(assets_for_region) && T.isArray(assets_for_region.image)  ? assets_for_region.image  : []
		const assets_html   = T.isObject(assets_for_region) && T.isArray(assets_for_region.html)   ? assets_for_region.html   : []

		const assets_style_selected  = assets_style.length  > 0 ? assets_style[0]  : undefined
		const assets_script_selected = assets_script.length > 0 ? assets_script[0] : undefined
		const assets_image_selected  = assets_image.length  > 0 ? assets_image[0]  : undefined
		const assets_html_selected   = assets_html.length   > 0 ? assets_html[0]   : undefined

		return {
			style:assets_style_selected,
			script:assets_script_selected,
			image:assets_image_selected,
			html:assets_html_selected
		}
	}
}


/*
Loading:
	create rt = new Runtime()
	rt.load()
		load_config
			fill config.*
		load_runtime
			create instances and fill runtime.*
			1 create servers
			2 create services
			3 create applications

EXAMPLES
	'rest_api_models_query':['*'],
	'rest_api_models_modifier':['*'],
	'rest_api_resources_query':['*'],
	'rest_api_resources_modifier':['*'],
	'html_assets':false,
	'html_app':false
*/