// NPM IMPORTS
import assert from 'assert'
import path from 'path'
import _ from 'lodash'

// COMMON IMPORTS
import T         from '../../../utils/types'
import attr_iter from '../../../utils/attributes_iterator'
import parser    from '../../../utils/parser/parser'


const context = 'common/topology/registry/loaders/load_packages'



let error_msg_bad_config = context + ':bad config'

let error_msg_bad_base_dir = context + ':package.base_dir should be a string'
let error_msg_bad_resources = context + ':package.resources should be an array'
let error_msg_bad_templates = context + ':package.templates should be an array'
let error_msg_bad_includes = context + ':package.includes should be an array'

let error_msg_bad_service = context + ':package.services.* should be an object'
let error_msg_bad_resource = context + ':package.resources.* should be a string'
let error_msg_bad_template = context + ':package.templates.* should be a string'
let error_msg_bad_include = context + ':package.includes.* should be a string'

let error_msg_bad_package_config = context + ':bad package config'
let error_msg_bad_resource_config = context + ':bad resource config'



function load_packages(logs, arg_packages_config, arg_base_dir)
{
	logs.info(context, 'loading world...packages')
	
	try{
		// CHECK PACKAGES
		assert(T.isObject(arg_packages_config), error_msg_bad_config)
		
		// LOOP ON PACKAGES
		let files = {}
		const load_one_package_fn = (package_name, package_obj, package_dir)=>{
			// BAD FORMAT
			if ( ! T.isObject(package_obj) )
			{
				throw 'error in packages.' + package_name + ':bad format, not a file name nor an object'
			}

			arg_packages_config[package_name] = load_package(logs, package_name, package_obj, package_dir, files)
			// console.log(package_obj, 'package_obj')

			// PROCESS ERRORS
			if (package_obj.commands && package_obj.commands.error)
			{
				throw 'error in packages.' + package_name + '.commands:' + package_obj.commands.error
			}
			if (package_obj.services && package_obj.services.error)
			{
				throw 'error in packages.' + package_name + '.services:' + package_obj.services.error 
			}
			if (package_obj.datasources && package_obj.datasources.error)
			{
				throw 'error in packages.' + package_name + '.datasources:' + package_obj.datasources.error 
			}
			if (package_obj.models && package_obj.models.error)
			{
				throw 'error in packages.' + package_name + '.models:' + package_obj.models.error 
			}
			if (package_obj.views && package_obj.views.error)
			{
				throw 'error in packages.' + package_name + '.views:' + package_obj.views.error
			}
			if (package_obj.menus && package_obj.menus.error)
			{
				throw 'error in packages.' + package_name + '.menus:' + package_obj.menus.error
			}
			if (package_obj.menubars && package_obj.menubars.error)
			{
				throw 'error in packages.' + package_name + '.menubars:' + package_obj.menubars.error
			}
		}
		Object.keys(arg_packages_config).forEach(
			function(arg_package_name)
			{
				if (arg_package_name == 'files')
				{
					return
				}
				
				logs.info(context, 'loading world...packages.' + arg_package_name)
				
				let package_obj = arg_packages_config[arg_package_name]

				// LOAD A FILE NAME
				if ( T.isString(package_obj) )
				{
					const pkg_name = package_obj
					const file_path_name = path.join(arg_base_dir, pkg_name)
					
					package_obj = require(file_path_name).packages

					const pkg_dir = path.dirname(file_path_name)

					// DEBUG
					logs.info(context + ':file=[%s] package_obj:', file_path_name, package_obj)

					Object.keys(package_obj).forEach(
						function(arg_sub_name)
						{
							const sub_pkg = package_obj[arg_sub_name]
							load_one_package_fn(arg_sub_name, sub_pkg, pkg_dir)
						}
					)
					return
				}

				// BAD FORMAT
				if ( ! T.isObject(package_obj) )
				{
					throw 'error in packages.' + arg_package_name + ':bad format, not a file name nor an object'
				}

				load_one_package_fn(arg_package_name, package_obj, arg_base_dir)
			}
		)
		
		// CACHE FILES CONTENT
		// arg_packages_config.files = files
	}
	catch(e)
	{
		arg_packages_config = { error: { context:context, exception:e, error_msg:e.toString() } }
		// console.error(context, arg_packages_config)
	}
	
	return arg_packages_config
}


function load_package(logs, arg_package_name, arg_package_config, arg_base_dir, files)
{
	logs.info(context, 'loading world...packages.' + arg_package_name + ':BEGIN')
	
	// CHECK PACKAGES
	assert(T.isObject(arg_package_config), error_msg_bad_config)
	arg_package_config.base_dir  = arg_package_config.base_dir  ? arg_package_config.base_dir  : ''
	arg_package_config.commands  = arg_package_config.commands  ? arg_package_config.commands  : {}
	arg_package_config.services  = arg_package_config.services  ? arg_package_config.services  : {}
	arg_package_config.resources = arg_package_config.resources ? arg_package_config.resources : {}
	arg_package_config.templates = arg_package_config.templates ? arg_package_config.templates : {}
	arg_package_config.includes  = arg_package_config.includes  ? arg_package_config.includes  : {}
	
	// LOAD COMMANDS
	if (T.isString(arg_package_config.commands))
	{
		logs.info(context, 'loading world...packages.' + arg_package_name + '.commands is a string')
		
		const absolute_path_name = path.join(arg_base_dir, arg_package_config.base_dir, arg_package_config.commands)
		arg_package_config.commands = parser.read(absolute_path_name, 'utf8').commands

		// const file_path_name = path.join(arg_base_dir, arg_package_config.commands)
		// arg_package_config.commands = require(file_path_name).commands
	}
	// console.log( Object.keys(arg_package_config.commands), 'arg_package_config.commands for ' + arg_package_name)

	// LOAD SERVICES
	if (T.isString(arg_package_config.services))
	{
		logs.info(context, 'loading world...packages.' + arg_package_name + '.services is a string')
		
		const absolute_path_name = path.join(arg_base_dir, arg_package_config.base_dir, arg_package_config.services)
		arg_package_config.services = parser.read(absolute_path_name, 'utf8').services

		// const file_path_name = path.join(arg_base_dir, arg_package_config.services)
		// arg_package_config.services = require(file_path_name).services
	}
	if ( T.isObject(arg_package_config.services) )
	{
		logs.info(context, 'loading world...packages.' + arg_package_name + '.services is now an object')
		// load_services(arg_package_config.services)
	}
	// console.log( Object.keys(arg_package_config.services), 'arg_package_config.services for ' + arg_package_name)

	// CHECK ATTRIBUTES
	assert(T.isString(arg_package_config.base_dir), error_msg_bad_base_dir  + ' for package ' + arg_package_name)
	assert(T.isArray(arg_package_config.resources), error_msg_bad_resources + ' for package ' + arg_package_name)
	assert(T.isArray(arg_package_config.templates), error_msg_bad_templates + ' for package ' + arg_package_name)
	assert(T.isArray(arg_package_config.includes),  error_msg_bad_includes  + ' for package ' + arg_package_name)
	
	// CHECK ATTRIBUTES ITEMS
	arg_package_config.resources.forEach( (resource) => { assert(T.isString(resource), error_msg_bad_resource) } )
	arg_package_config.templates.forEach( (template) => { assert(T.isString(template), error_msg_bad_template) } )
	arg_package_config.includes.forEach(  (include) => { assert(T.isString(include), error_msg_bad_include) } )
	
	// INIT RESOURCES REPOSITORY
	arg_package_config.resources_by_name = {}
	arg_package_config.resources_by_type = {}
	arg_package_config.resources_by_file = {}
	arg_package_config.resources_by_type.templates = {}
	arg_package_config.resources_by_type.views = {}
	arg_package_config.resources_by_type.models = {}
	arg_package_config.resources_by_type.menubars = {}
	arg_package_config.resources_by_type.menus = {}
	arg_package_config.resources_by_type.datasources = {}
	arg_package_config.resources_by_type.services = {}
	arg_package_config.resources_by_type.commands = {}
	arg_package_config.views = {}
	arg_package_config.models = {}
	arg_package_config.menubars = {}
	arg_package_config.menus = {}
	arg_package_config.datasources = {}

	// REGISTER SERVICES AS RESOURCES
	Object.keys(arg_package_config.services).forEach(
		(svc_name) => {
			const svc = arg_package_config.services[svc_name]
			assert(T.isObject(svc), error_msg_bad_service)
			logs.info(context, 'loading world...packages.' + arg_package_name + '.services.' + svc_name + ' is registered')
			
			// REGISTER BASE DIRECTORIES
			svc.app_base_dir = arg_base_dir
			svc.pkg_base_dir = arg_package_config.base_dir

			arg_package_config.resources_by_name[svc_name] = svc
			arg_package_config.resources_by_type['services'][svc_name] = svc
		}
	)

	// REGISTER COMMANDS AS RESOURCES
	Object.keys(arg_package_config.commands).forEach(
		(cmd_name) => {
			const cmd = arg_package_config.commands[cmd_name]
			assert(T.isObject(cmd), error_msg_bad_service)
			logs.info(context, 'loading world...packages.' + arg_package_name + '.commands.' + cmd_name + ' is registered')

			arg_package_config.resources_by_name[cmd_name] = cmd
			arg_package_config.resources_by_type['commands'][cmd_name] = cmd
		}
	)
	
	// LOAD TEMPLATES
	const templates = arg_package_config.templates
	templates.forEach(
		(template_file) => {
			logs.info(context, 'loading world...packages.' + arg_package_name + ' arg_base_dir:' + arg_base_dir)
			logs.info(context, 'loading world...packages.' + arg_package_name + ' templates file:' + template_file)
			logs.info(context, 'loading world...packages.' + arg_package_name + ' arg_package_config.base_dir:' + arg_package_config.base_dir)
			
			if ( ! T.isNotEmptyString(template_file) )
			{
				return
			}
			
			let relative_path_name = T.isNotEmptyString(arg_package_config.base_dir) ? path.join(arg_package_config.base_dir, template_file) : template_file
			logs.info(context, 'loading world...packages.' + arg_package_name + ' relative_path_name:' + relative_path_name)

			let absolute_path_name = path.join(arg_base_dir , relative_path_name)
			
			let config = parser.read(absolute_path_name, 'utf8')
			// console.log(config, 'config')
			
			// GET TEMPLATES
			if (! config.templates )
			{
				return
			}
			config = config.templates

			files[relative_path_name] = config
			arg_package_config.resources_by_file[relative_path_name] = {}
			
			// CHECK package
			assert(T.isObject(config), error_msg_bad_package_config + ' for file ' + template_file)
			
			const types = ['views', 'models', 'menubars', 'menus', 'datasources']
			types.forEach(
				(type_name)=>{
					logs.info(context, 'loading begin world...packages.' + arg_package_name + ' templates file:' + template_file + ' of type:' + type_name)
					
					if ( config[type_name] && T.isObject(config[type_name]) )
					{
						load_package_template(logs, arg_package_name, arg_package_config, config[type_name], type_name, relative_path_name)
					}

					logs.info(context, 'loading end world...packages.' + arg_package_name + ' templates file:' + template_file + ' of type:' + type_name)
				}
			)
		}
	)
	
	// LOAD RESOURCES
	const resources = arg_package_config.resources
	resources.forEach(
		(resource_file) => {
			logs.info(context, 'loading world...packages.' + arg_package_name + ' resources file:' + resource_file)
			
			let relative_path_name = path.join(arg_package_config.base_dir, resource_file)
			let absolute_path_name = path.join(arg_base_dir , relative_path_name)
			
			let config = parser.read(absolute_path_name, 'utf8')
			// console.log(config, 'config')
			
			files[relative_path_name] = config
			arg_package_config.resources_by_file[relative_path_name] = {}
			
			// CHECK package
			assert(T.isObject(config), error_msg_bad_package_config + ' for file ' + resource_file)
			
			const types = ['views', 'models', 'menubars', 'menus', 'datasources']
			types.forEach(
				(type_name)=>{
					logs.info(context, 'loading world...packages.' + arg_package_name + ' resources file:' + resource_file + ' of type:' + type_name)
					
					if ( config[type_name] && T.isObject(config[type_name]) )
					{
						load_package_children(logs, arg_package_name, arg_package_config, config[type_name], type_name, relative_path_name)
					}
				}
			)
		}
	)
	
	logs.info(context, 'loading world...packages.' + arg_package_name + ':END')
	return arg_package_config
}


function load_package_children(logs, arg_package_name, arg_package_config, arg_children, type_name, relative_path_name)
{
	Object.keys(arg_children).forEach(
		(res_name) => {
			logs.debug(context, 'loading world...packages.' + arg_package_name + ' resource children for ' + res_name)
			
			let res_obj = arg_children[res_name]
			
			// DEBUG
			// console.log('load_package_children:res_obj=', JSON.stringify(res_obj) )

			// TEMPLATE
			if ( T.isNotEmptyString(res_obj.template) )
			{
				// console.log('load_package_children:res_obj=', JSON.stringify(res_obj) )

				const template_name = res_obj.template
				const template_resource = arg_package_config.templates[template_name]
				assert(T.isObject(template_resource), error_msg_bad_resource_config + ' for ' + res_name + ' with template ' + template_name)

				const template_clone = _.clone(template_resource)
				const res_clone = _.clone(res_obj)

				res_obj = _.merge(template_clone, res_clone)
				const xform_fn = (v)=>{
					if ( T.isNotEmptyString(v) )
					{
						return v.replace('{{devapt-template-id}}', res_name)
					}
					return v
				}
				res_obj = attr_iter(res_obj, xform_fn)
				arg_children[res_name] = res_obj

				// DEBUG
				// console.log(context + ':load_package_children:' + arg_package_name + ' resource [%s] of collection [%s] from template [%s]:', res_name, type_name, template_name, res_obj)
				// if (res_obj && res_obj.state && res_obj.state.space)
				// {
				// 	console.log(context + ':load_package_children:' + arg_package_name + ' resource [%s] of collection [%s] from template [%s]', res_name, type_name, template_name)
					
				// 	console.log(context + ':load_package_children:' + arg_package_name + ':source=')
				// 	console.log(res_clone.state.space)
					
				// 	console.log(context + ':load_package_children:' + arg_package_name + ':template=')
				// 	console.log(template_clone.state.space)
					
				// 	console.log(context + ':load_package_children:' + arg_package_name + ':merge=')
				// 	console.log(res_obj.state.space)
				// }
			}
			
			// GET RESOURCE TYPE
			if (type_name !== 'menus' && type_name !== 'models')
			{
				res_obj.class_name = res_obj.class_name ? res_obj.class_name : res_obj.type
				assert(T.isString(res_obj.class_name), error_msg_bad_resource_config + ' for resource ' + res_name)
			}
			
			res_obj.collection = type_name
			res_obj.name = res_name
			
			arg_package_config.resources_by_name[res_name] = res_obj
			arg_package_config.resources_by_type[type_name][res_name] = res_obj
			arg_package_config.resources_by_file[relative_path_name][res_name] = res_obj
			arg_package_config[type_name][res_name] = res_obj

			if ( T.isObject(res_obj.children) )
			{
				load_package_children(logs, arg_package_name, arg_package_config, res_obj.children, type_name, relative_path_name)
			}
		}
	)
}


function load_package_template(logs, arg_package_name, arg_package_config, arg_children, type_name, relative_path_name)
{
	Object.keys(arg_children).forEach(
		(res_name) => {
			logs.debug(context, 'loading begin world...packages.' + arg_package_name + ' resource template for ' + res_name)
			
			let res_obj = arg_children[res_name]
			
			// DEBUG
			// console.log('load_package_template:res_obj=', JSON.stringify(res_obj.state) )
			
			// TEMPLATE
			if ( T.isNotEmptyString(res_obj.template) )
			{
				const template_name = res_obj.template
				let template_resource = arg_package_config.templates[template_name]
				if (! template_resource)
				{
					template_resource = arg_children[template_name]
				}
				if (! template_resource)
				{
					console.error(context + ':load_package_template:package=[' + arg_package_name + '] resource=[' + res_name + ']: template not found for [' + template_name + ']')
				}
				assert(T.isObject(template_resource), error_msg_bad_resource_config + ' for ' + res_name + ' with template ' + template_name)
				const template_clone = _.clone(template_resource)
				const res_clone = _.clone(res_obj)
				res_obj = _.merge(template_clone, res_clone)

				// DEBUG
				// console.log(context + ':load_package_template world...packages.' + arg_package_name + ' resource [%s] of collection [%s] from template [%s] src[%o] template[%o] merg[%o]:', res_name, type_name, template_name, tmp, clone, res_obj)
				// if (res_obj && res_obj.state && res_obj.state.space)
				// {
				// 	console.log(context + ':load_package_template world...packages.' + arg_package_name + ' resource [%s] of collection [%s] from template [%s]', res_name, type_name, template_name)
					
				// 	console.log(context + ':load_package_template world...packages.' + arg_package_name + ':source=')
				// 	console.log(res_clone.state.space)
					
				// 	console.log(context + ':load_package_template world...packages.' + arg_package_name + ':template=')
				// 	console.log(template_clone.state.space)
					
				// 	console.log(context + ':load_package_template world...packages.' + arg_package_name + ':merge=')
				// 	console.log(res_obj.state.space)
				// }
			}

			if (type_name !== 'menus' && type_name !== 'models')
			{
				res_obj.class_name = res_obj.class_name ? res_obj.class_name : res_obj.type
				assert(T.isString(res_obj.class_name), error_msg_bad_resource_config + ' for resource ' + res_name)
			}
			
			res_obj.collection = type_name
			res_obj.name = res_name

			// console.log('arg_package_config.templates', arg_package_config.templates)
			// console.log('arg_package_config.resources_by_type.templates', arg_package_config.resources_by_type.templates)
			// console.log('arg_package_config.resources_by_file[relative_path_name]', arg_package_config.resources_by_file[relative_path_name])

			arg_package_config.resources_by_type.templates[res_name] = res_obj
			arg_package_config.resources_by_file[relative_path_name][res_name] = res_obj
			arg_package_config.templates[res_name] = res_obj

			// if ( T.isObject(res_obj.children) )
			// {
			// 	load_package_template(logs, arg_package_name, arg_package_config, res_obj.children, type_name, relative_path_name)
			// }
			logs.debug(context, 'loading end world...packages.' + arg_package_name + ' resource template for ' + res_name)
		}
	)
}


export default load_packages
