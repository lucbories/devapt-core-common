// NPM IMPORTS
// import assert from 'assert'

// COMMON IMPORTS
import TopologyDefineItem from './topology_define_item'
import TopologyDefinePackage from './topology_define_package'
import TopologyDefineApplication from './topology_define_application'


let context = 'common/topology/define/topology_define_tenant'



/**
 * @file TopologyDefineTenant class: describe a Tenant topology item.
 * 
 * @author Luc BORIES
 * 
 * @license Apache-2.0
 */
export default class TopologyDefineTenant extends TopologyDefineItem
{
	/**
	 * Create a TopologyDefineTenant instance.
	 * @class TopologyDefineTenant
	 * @extends TopologyDefineItem
	 * 
	 * SETTINGS FORMAT:
	 * 	  Object with:
	 * 		"packages":
	 *			"packageA":...
	 * 		"applications":
	 *			"applicationA":...
	 * 		"security":...
	 * 	}
	 * 
	 * @param {string} arg_name - instance name.
	 * @param {object} arg_settings - instance settings map.
	 * @param {string} arg_log_context - trace context string.
	 * 
	 * @returns {nothing}
	 */
	constructor(arg_name, arg_settings, arg_log_context)
	{
		const log_context = arg_log_context ? arg_log_context : context
		super(arg_name, arg_settings, 'TopologyDefineTenant', log_context)
		
		this.is_topology_define_tenant = true

		this.topology_type = 'tenants'

		this.declare_collection('packages', 'package', TopologyDefinePackage)
		this.declare_collection('applications', 'application', TopologyDefineApplication)
		
		this.info('Tenant is created')
	}



	/**
	 * Find a service.
	 * 
	 * @param {string} arg_svc_name - service name.
	 * 
	 * @returns {TopologyDefineService|undefined}
	 */
	get_service(arg_svc_name)
	{
		const packages = this.packages().get_latest_items()
		let i = 0
		let count = packages.length
		this.debug('get_service:svc [' + arg_svc_name + '] with packages count [' + count + ']')
		
		for( ; i < count ; ++i)
		{
			const pkg = packages[i]
			this.debug('get_service:svc [' + arg_svc_name + '] loop on package [' + pkg.get_name() + ']')

			const svc = pkg.service(arg_svc_name)
			if (svc)
			{
				this.debug('get_service:svc found [' + arg_svc_name + '] on package [' + pkg.get_name() + ']')
				return svc
			}
			
			this.debug('get_service:svc not found [' + arg_svc_name + '] on package [' + pkg.get_name() + ']')
		}
		return undefined
	}
}
