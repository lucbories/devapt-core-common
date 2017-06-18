// NPM IMPORTS
import assert from 'assert'
import _ from 'lodash'

// COMMON IMPORTS
import T from '../../utils/types'
import TopologyDeployItem from './topology_deploy_item'


const context = 'common/topology/deploy/topology_deploy_local_node'



/**
 * TopologyDeployLocalNode class.
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 * 
 * @example
* 	API:
* 		this.deployed_tenants[deployed_tenant_name] = 
*				name:deployed_tenant_name,		// String
*				tenant:defined_tenant,			// TopologyDefineTenant instance
*				services:
*					svc_name:svc				// TopologyDefinedService instance
*				applications:
*					app_name:
*						name:app_name,				// String
*						tenant:defined_tenant,		// TopologyDefineTenant instance
*						appplication:defined_app,	// TopologyDefinedApplication instance
*						services:
*							svc_name:svc			// TopologyDefinedService instance
*						assets:
*							...						// See TopologyDefinedApplication instance assets
* 
 */
export default class TopologyDeployLocalNode extends TopologyDeployItem
{
	/**
	 * Create a TopologyDeployNode instance.
	 * 
	 * @param {string} arg_name - instance name.
	 * @param {TopologyDefineItem} arg_definition_item - topology definition item.
	 * @param {object} arg_settings - instance settings map.
	 * @param {object} arg_deploy_factory - factory object { create(type, name, settings) { return TopologyDeployItem } }
	 * @param {string} arg_log_context - trace context string.
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_name, arg_definition_item, arg_settings, arg_deploy_factory, arg_log_context)
	{
		const log_context = arg_log_context ? arg_log_context : context
		super(arg_name, arg_definition_item, arg_settings, 'TopologyDeployLocalNode', log_context)
		
		assert( T.isObject(arg_definition_item) && arg_definition_item.is_topology_define_node, context + ':constructor:bad node topology definition object')
		assert( T.isObject(arg_deploy_factory), context + ':constructor:bad factory object')
		assert( T.isFunction(arg_deploy_factory.create), context + ':constructor:bad factory.create function')

		this.is_topology_deploy_local_node = true

		this.topology_type = 'local_nodes'

		this.deployed_factory = arg_deploy_factory
		this.deployed_tenants = {}
		
		this.info('Local Node is created')
	}



	/**
	 * Get deployed tenants.
	 * 
	 * @returns {array} - deployed tenants.
	 */
	get_deployed_tenants_names()
	{
		this.enter_group('get_deployed_tenants')

		const tenants = Object.keys(this.deployed_tenants)

		this.leave_group('get_deployed_tenants')
		return tenants
	}



	/**
	 * Get deployed tenant informations.
	 * 
	 * @param {string} arg_tenant_name - tenant name.
	 * 
	 * @returns {object} - deployed tenant infos.
	 */
	get_deployed_tenant_topology(arg_tenant_name)
	{
		this.enter_group('get_deployed_tenant_topology')

		// CHECK TENANT NAME
		if (! this.deployed_tenants || ! (arg_tenant_name in this.deployed_tenants) )
		{
			this.leave_group('get_deployed_tenant_topology:tenant not found')
			return undefined
		}

		const deployed_tenant_topology = this.deployed_tenants[arg_tenant_name]
		if (! deployed_tenant_topology)
		{
			this.leave_group('get_deployed_tenant_topology:bad tenant topology')
			return undefined
		}

		this.leave_group('get_deployed_tenant_topology')
		return deployed_tenant_topology
	}



	/**
	 * Get deployed tenants informations.
	 * 
	 * @param {boolean} arg_deep - get deep sub items information on true (default:true).
	 * 
	 * @returns {object} - deployed tenant infos.
	 */
	get_deployed_tenants_infos(arg_deep=true)
	{
		this.enter_group('get_deployed_tenants_infos')

		const deployed_tenants_infos = {}

		_.forEach(this.deployed_tenants,
			(deployed_tenant_topology, tenant_name)=>{
				if (! deployed_tenant_topology)
				{
					this.leave_group('get_deployed_tenants_infos:bad tenant topology')
					return undefined
				}

				const tenant = deployed_tenant_topology.tenant

				if (! tenant)
				{
					this.leave_group('get_deployed_tenants_infos:bad tenant instance')
					return undefined
				}
				deployed_tenants_infos[tenant_name] = tenant.get_topology_info(arg_deep)
			}
		)

		this.leave_group('get_deployed_tenants_infos')
		return deployed_tenants_infos
	}



	/**
	 * Get deployed tenant informations.
	 * 
	 * @param {string} arg_tenant_name - tenant name.
	 * @param {boolean} arg_deep - get deep sub items information on true (default:true).
	 * 
	 * @returns {object} - deployed tenant infos.
	 */
	get_deployed_tenant_infos(arg_tenant_name, arg_deep=true)
	{
		this.enter_group('get_deployed_tenant_infos')

		const deployed_tenant_topology = this.get_deployed_tenant_topology(arg_tenant_name)
		if (! deployed_tenant_topology)
		{
			this.leave_group('get_deployed_tenant_infos:bad tenant topology')
			return undefined
		}

		const tenant = deployed_tenant_topology.tenant

		if (! tenant)
		{
			this.leave_group('get_deployed_tenant_infos:bad tenant instance')
			return undefined
		}

		this.leave_group('get_deployed_tenant_infos')
		return tenant.get_topology_info(arg_deep)
	}



	/**
	 * Get deployed tenant applications names.
	 * 
	 * @param {string} arg_tenant_name - tenant name.
	 * 
	 * @returns {array} - deployed tenant applications names.
	 */
	get_deployed_tenant_applications_names(arg_tenant_name)
	{
		this.enter_group('get_deployed_tenant_applications_names')

		const deployed_tenant_topology = this.get_deployed_tenant_topology(arg_tenant_name)
		if (! deployed_tenant_topology)
		{
			this.leave_group('get_deployed_tenant_applications_names:bad tenant topology')
			return undefined
		}

		const apps_names = Object.keys(deployed_tenant_topology.applications)

		this.leave_group('get_deployed_tenant_applications_names')
		return apps_names
	}



	/**
	 * Get deployed tenant applications infos.
	 * 
	 * @param {string} arg_tenant_name - tenant name.
	 * @param {boolean} arg_deep - get deep sub items information on true (default:true).
	 * 
	 * @returns {object} - deployed tenant applications infos.
	 */
	get_deployed_tenant_applications_infos(arg_tenant_name, arg_deep=true)
	{
		this.enter_group('get_deployed_tenant_applications_infos')

		const deployed_tenant_topology = this.get_deployed_tenant_topology(arg_tenant_name)
		if (! deployed_tenant_topology)
		{
			this.leave_group('get_deployed_tenant_applications_infos:bad tenant topology')
			return undefined
		}

		const apps_infos = {}
		_.forEach(deployed_tenant_topology.applications,
			(app, app_name)=>{
				apps_infos[app_name] = app.get_topology_info(arg_deep)
			}
		)

		this.leave_group('get_deployed_tenant_applications_infos')
		return apps_infos
	}



	/**
	 * Get deployed tenant services names.
	 * 
	 * @param {string} arg_tenant_name - tenant name.
	 * 
	 * @returns {array} - deployed tenant services names.
	 */
	get_deployed_tenant_services_names(arg_tenant_name)
	{
		this.enter_group('get_deployed_tenant_services_names')

		const deployed_tenant_topology = this.get_deployed_tenant_topology(arg_tenant_name)
		if (! deployed_tenant_topology)
		{
			this.leave_group('get_deployed_tenant_services_names:bad tenant topology')
			return undefined
		}

		const services_names = Object.keys(deployed_tenant_topology.services)

		this.leave_group('get_deployed_tenant_services_names')
		return services_names
	}



	/**
	 * Get deployed tenant services infos.
	 * 
	 * @param {string} arg_tenant_name - tenant name.
	 * @param {boolean} arg_deep - get deep sub items information on true (default:true).
	 * 
	 * @returns {object} - deployed tenant services infos.
	 */
	get_deployed_tenant_services_infos(arg_tenant_name, arg_deep=true)
	{
		this.enter_group('get_deployed_tenant_services_infos')

		const deployed_tenant_topology = this.get_deployed_tenant_topology(arg_tenant_name)
		if (! deployed_tenant_topology)
		{
			this.leave_group('get_deployed_tenant_services_infos:bad tenant topology')
			return undefined
		}

		const svcs_infos = {}
		_.forEach(deployed_tenant_topology.services,
			(svc, svc_name)=>{
				svcs_infos[svc_name] = svc.get_topology_info(arg_deep)
				svcs_infos[svc_name].operations = svc.get_a_provider().get_operations_names()
			}
		)

		this.leave_group('get_deployed_tenant_services_infos')
		return svcs_infos
	}



	/**
	 * Get deployed tenant services infos.
	 * 
	 * @param {string} arg_tenant_name - tenant name.
	 * @param {string} arg_svc_name - service name.
	 * @param {boolean} arg_deep - get deep sub items information on true (default:true).
	 * 
	 * @returns {object} - deployed tenant services infos.
	 */
	get_deployed_tenant_service_infos(arg_tenant_name, arg_svc_name, arg_deep=true)
	{
		this.enter_group('get_deployed_tenant_service_infos')

		const deployed_tenant_topology = this.get_deployed_tenant_topology(arg_tenant_name)
		if (! deployed_tenant_topology)
		{
			this.leave_group('get_deployed_tenant_service_infos:bad tenant topology')
			return undefined
		}

		if (arg_svc_name in deployed_tenant_topology.services)
		{
			const svc = deployed_tenant_topology.services[arg_svc_name]
			const svc_infos = svc.get_topology_info(arg_deep)
			svc_infos.operations = svc.get_a_provider().get_operations_names()
			
			this.leave_group('get_deployed_tenant_service_infos')
			return svc_infos
		}

		this.leave_group('get_deployed_tenant_service_infos:service not found for [' + arg_svc_name + ']')
		return undefined
	}



	/**
	 * Get deployed nodes names.
	 * 
	 * @returns {array} - nodes names.
	 */
	get_deployed_nodes_names()
	{
		this.enter_group('get_deployed_nodes_names')

		const defined_node = this.get_topology_definition_item()
		const defined_world = defined_node.get_topology_owner()
		const nodes = defined_world.nodes()
		const nodes_names = nodes.get_all_names()

		this.leave_group('get_deployed_nodes_names')
		return nodes_names
	}



	/**
	 * Find a deployed service in tenants services.
	 * 
	 * @param {string} arg_svc_name - service name.
	 * 
	 * @returns {Service} - deployed service instance.
	 */
	find_deployed_service(arg_svc_name)
	{
		this.enter_group('find_deployed_service')

		this.debug('find_deployed_service', 'service', arg_svc_name)

		// LOOP ON TENANTS
		const tenants_names = this.get_deployed_tenants_names()
		for(const tenant_name of tenants_names)
		{
			const svc = this.get_deployed_service(tenant_name, arg_svc_name)
			if (svc && svc.is_service)
			{
				this.debug('find_deployed_service', 'tenant', tenant_name)
				this.leave_group('find_deployed_service:found')
				return svc
			}
		}
		
		this.leave_group('find_deployed_service:not found')
		return undefined
	}



	/**
	 * Get or create a deployed service.
	 * 
	 * @param {string} arg_tenant_name - tenant name.
	 * @param {string} arg_svc_name - service name.
	 * 
	 * @returns {Service} - deployed service instance.
	 */
	get_deployed_service(arg_tenant_name, arg_svc_name)
	{
		this.enter_group('get_deployed_service')

		this.debug('get_deployed_service', 'tenant', arg_tenant_name)
		this.debug('get_deployed_service', 'service', arg_svc_name)

		// GET TENANT
		const defined_node = this.get_topology_definition_item()
		const defined_world = defined_node.get_topology_owner()
		const defined_tenant = defined_world.tenant(arg_tenant_name)
		assert( T.isObject(defined_tenant) && defined_tenant.is_topology_define_tenant, context + ':get_deployed_service:bad tenant object for [' + arg_tenant_name + ']')

		// GET TENANT DEPLOYMENT
		if (! T.isObject(this.deployed_tenants[arg_tenant_name]) )
		{
			this.deployed_tenants[arg_tenant_name] = {
				name:arg_tenant_name,
				tenant:defined_tenant,
				services:{},
				applications:{}
			}
		}
		const deployed_tenant = this.deployed_tenants[arg_tenant_name]

		// SERVICE IS ALREADY DEPLOYED ON TENANT
		if (arg_svc_name in deployed_tenant.services)
		{
			this.leave_group('get_deployed_service (already deployed)')
			return deployed_tenant.services[arg_svc_name]
		}

		// GET SERVICE DEFINITION
		const defined_service = defined_tenant.get_service(arg_svc_name)
		this.debug('get_deployed_service:defined_service', defined_service)
		if (! defined_service)
		{
			this.error(context + ':get_deployed_service:definition not found for service [' + arg_svc_name + '] for tenant [' + arg_tenant_name + ']')
			
			this.leave_group('get_deployed_service (error)')
			return undefined
		}
		this.debug('get_deployed_service:defined service found [' + arg_svc_name + ']')

		// CREATE SERVICE
		let service = undefined
		const settings = defined_service.get_settings()
		service = this.deployed_factory.create('service', arg_svc_name, settings)
		if (! service)
		{
			this.error(context + ':get_deployed_service:creation failed for service [' + arg_svc_name + '] for tenant [' + arg_tenant_name + ']')
			
			this.leave_group('get_deployed_service (error)')
			return undefined
		}
		this.debug('get_deployed_service:service instance created [' + arg_svc_name + '] for tenant [' + arg_tenant_name + ']')
		
		// ENABLE SERVICE
		service.enable()
		this.debug('get_deployed_service:service is enabled')
		this.deployed_tenants[arg_tenant_name].services[arg_svc_name] = service

		this.leave_group('get_deployed_service')
		return service
	}



	/**
	 * Deploy defined topology on this local node.
	 * 
	 * @returns {Promise} - Promise(boolean)
	 */
	deploy()
	{
		this.enter_group('deploy')

		const defined_world = this.get_topology_definition_item().get_topology_owner()

		// LOOP ON TENANTS TO DEPLOY
		const deployed_tenants = this.get_settings().toJS()
		_.forEach(deployed_tenants,
			(deployed_apps, deployed_tenant_name)=>{
				// SKIP SPECIAL CASES
				if (deployed_tenant_name == 'runtime' || deployed_tenant_name == 'logger_manager')
				{
					return
				}
				
				this.info('deploy:loop on tenant:' + deployed_tenant_name)

				
				// GET DEFINED TENANT
				const defined_tenant = defined_world.tenant(deployed_tenant_name)
				if (! defined_tenant)
				{
					this.leave_group('deploy (error):bad tenant for ' + deployed_tenant_name)
					return Promise.reject('deploy:tenant ' + deployed_tenant_name + ' not found for world')
				}

				// INIT TENANT
				this.deployed_tenants[deployed_tenant_name] = {
					name:deployed_tenant_name,
					tenant:defined_tenant,
					services:{},
					applications:{}
				}

				// LOOP ON APPLICATIONS TO DEPLOY
				// const deployed_apps = deployed_tenants[deployed_tenant_name]
				_.forEach(deployed_apps,
					(deployed_app, deployed_app_name)=>{
						this.info('deploy:loop on application:' + deployed_app_name)

						// GET DEFINED APPLICATION
						const defined_app = defined_tenant.application(deployed_app_name)
						if (! defined_app)
						{
							this.leave_group('deploy (error):bad application for ' + deployed_app_name)
							return Promise.reject('deploy:application ' + deployed_app_name + ' not found for tenant ' + deployed_tenant_name)
						}

						// INIT TENANT APPLICATION
						const deployed_app_topology = {
							name:deployed_app_name,
							tenant:defined_tenant,
							application:defined_app,
							services:{},
							assets:{}
						}
						
						// LOOP ON APPLICATION SERVICES TO DEPLOY
						const deployed_app_services = deployed_app.services
						_.forEach(deployed_app_services,
							(deployed_app_svc, deployed_svc_name)=>{
								this.info('deploy:loop on service:' + deployed_svc_name)

								// const deployed_app_svc = deployed_app_services[deployed_svc_name]
								const service = this.get_deployed_service(deployed_tenant_name, deployed_svc_name)

								if (! service || ! service.is_service)
								{
									this.error('deploy:services:service not found [' + deployed_svc_name + '] for tenant [' + deployed_tenant_name + ']')
									return
								}

								// LOOP ON DEPLOYED APPLICATION SERVICE SERVERS
								service.activate(defined_app, deployed_app_svc)
								service.enable()

								deployed_app_topology.services[deployed_svc_name] = service
								this.deployed_tenants[deployed_tenant_name].services[deployed_svc_name] = service
							}
						)
						
						// LOOP ON APPLICATION ASSETS TO DEPLOY
						let deployed_assets = {}
						const deployed_app_assets = deployed_apps[deployed_app_name].assets
						assert( T.isObject(deployed_app_assets), context + ':deploy:bad assets object')
						if ( T.isObject(deployed_app_assets.regions) )
						{
							assert( T.isObject(deployed_app_assets.regions), context + ':deploy:bad assets.regions object')
							_.forEach(deployed_app_assets.regions,
								(deployed_region, deployed_region_name)=>{
									this.info('deploy:loop on assets region:' + deployed_region_name)

									// const deployed_region = deployed_app_assets.regions[deployed_region_name]
									assert( T.isObject(deployed_region), context + ':deploy:bad assets.regions.* object for region ' + deployed_region_name)

									const style_svc_array  = T.isArray(deployed_region.style)  ? deployed_region.style  : []
									const script_svc_array = T.isArray(deployed_region.script) ? deployed_region.script : []
									const image_svc_array  = T.isArray(deployed_region.image)  ? deployed_region.image  : []
									const html_svc_array   = T.isArray(deployed_region.html)   ? deployed_region.html   : []
												
									deployed_assets[deployed_region_name] = {
										style:style_svc_array,
										script:script_svc_array,
										image:image_svc_array,
										html:html_svc_array
									}
								}
							)
						}

						deployed_app_topology.assets = deployed_app_assets
						this.deployed_tenants[deployed_tenant_name].applications[deployed_app_name] = deployed_app_topology

						// REGISTER ASSETS ON DEPLOYED SERVICES
						_.forEach(deployed_app_services,
							(service_cfg, svc_name)=>{
								const service = this.deployed_tenants[deployed_tenant_name].services[svc_name]
								if (! service || ! service.is_service)
								{
									this.error('deploy:assets:service not found [' + svc_name + '] for tenant [' + deployed_tenant_name + ']')
									return
								}
								service.topology_deploy_assets = deployed_assets
							}
						)
					}
				)
			}
		)

		this.leave_group('deploy')
		return Promise.resolve(true)
	}
}
