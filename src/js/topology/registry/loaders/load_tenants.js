// NPM IMPORTS
import assert from 'assert'
import path from 'path'
import _ from 'lodash'

// COMMON IMPORTS
import T                 from '../../../utils/types'
import load_applications from './load_applications'
import load_packages     from './load_packages'


const context = 'common/topology/registry/loaders/load_tenants'


const error_msg_bad_config = context + ':bad config'


function load_tenants(logs, arg_tenants_config, arg_plugins, arg_base_dir)
{
	logs.info(context, 'loading world.tenants from ' + arg_base_dir)
	
	try{
		// CHECK ARGS
		assert(T.isObject(arg_tenants_config), error_msg_bad_config)
		
		// LOOP ON TENANTS
		let error = undefined
		Object.keys(arg_tenants_config).forEach(
			function(tenant_name)
			{
				if (arg_tenants_config.error)
				{
					error = arg_tenants_config.error
				}
				if (error)
				{
					logs.info(context, 'skip tenants.' + tenant_name + ' because an error occured.')
					return
				}

				// logs.info(context, 'loading config.tenants.' + tenant_name)

				let tenant_obj = arg_tenants_config[tenant_name]
				tenant_obj = load_tenant(logs, tenant_name, tenant_obj, arg_plugins, arg_base_dir)
				// console.log(tenant_obj, 'tenant_obj')

				// PROCESS ERRORS
				if (tenant_obj.error)
				{
					error = tenant_obj.error
					error.context = error.context + ' for ' + tenant_name
				}
			}
		)

		if (error)
		{
			arg_tenants_config = { error: error }
			// console.error(context, error)
		}
	}
	catch(e)
	{
		arg_tenants_config = { error: { context:context, exception:e } }
		// console.error(arg_tenants_config)
	}
	
	return arg_tenants_config
}


function load_tenant(logs, arg_tenant_name, arg_tenant_config, arg_plugins, arg_base_dir)
{
	logs.info(context, 'loading world.tenants.' + arg_tenant_name + ' from ' + arg_base_dir)
	// console.log(arg_tenant_config, 'arg_tenant_config')

	// CHECK ARGS
	assert(T.isObject(arg_tenant_config), error_msg_bad_config)

	// LOAD PACKAGES
	const packages_array = T.isArray(arg_tenant_config.packages) ? arg_tenant_config.packages : [arg_tenant_config.packages]
	const loaded_packages = { packages:{} }
	let loaded_errors = undefined
	let loaded_basedir = arg_base_dir
	packages_array.forEach(
		(pkg_item)=>{
			if ( T.isString(pkg_item) )
			{
				const file_path_name = path.join(loaded_basedir, pkg_item)
				logs.info(context, 'loading world.tenants.' + arg_tenant_name + '.packages: loading file with file_path_name=' + file_path_name)
				pkg_item = {}
				pkg_item.packages = require(file_path_name).packages
				loaded_basedir = path.dirname(file_path_name)
				logs.info(context, 'loading world.tenants.' + arg_tenant_name + '.packages: loading file with base dir=' + loaded_basedir)
			}
			if ( T.isObject(pkg_item.packages) )
			{
				logs.info(context, 'loading world.tenants.' + arg_tenant_name + '.packages with base dir=' + loaded_basedir)
				const pkgs = load_packages(logs, pkg_item.packages, loaded_basedir)
				_.forEach(pkgs,
					(pkg, pkg_name)=>{
						loaded_packages.packages[pkg_name] = pkg
					}
				)
				
				// PROCESS ERROR
				if (loaded_packages.packages.error)
				{
					loaded_errors = {
						error:loaded_packages.packages.error
					}
					return
				}
			}
		}
	)
	// PROCESS ERROR
	if (loaded_errors)
	{
		return loaded_errors
	}
	arg_tenant_config.packages = loaded_packages.packages
	
	// CONSOLID SERVICES
	let services = {}
	Object.keys(arg_tenant_config.packages).forEach(
		(pkg_name)=>{
			if (pkg_name != 'files')
			{
				logs.info(context, 'loading world.tenants.' + arg_tenant_name + ' consolidated services for pkg ' + pkg_name)
				const pkg = arg_tenant_config.packages[pkg_name]

				Object.keys(pkg.services).forEach(
					(svc_name)=>{
						services[svc_name] = pkg.services[svc_name]
						logs.info(context, 'loading world.tenants.' + arg_tenant_name + ' consolid service for ' + svc_name)
					}
				)
			}
		}
	)
	logs.info(context, 'loading world.tenants.' + arg_tenant_name + ' consolidated services:' + Object.keys(services).toString())

	// LOAD APPLICATIONS
	if (T.isString(arg_tenant_config.applications))
	{
		const file_path_name = path.join(arg_base_dir, arg_tenant_config.applications)
		arg_tenant_config.applications = require(file_path_name).applications
	}
	if ( T.isObject(arg_tenant_config.applications) )
	{
		logs.info(context, 'loading world.tenants.' + arg_tenant_name + '.applications')
		arg_tenant_config.applications = load_applications(logs, arg_tenant_config.applications, arg_tenant_config.packages, arg_plugins, services, arg_base_dir)
		
		// PROCESS ERROR
		if (arg_tenant_config.applications.error)
		{
			arg_tenant_config = {
				error:arg_tenant_config.applications.error
			}
			return arg_tenant_config
		}
	}

	return arg_tenant_config
}


export default load_tenants
