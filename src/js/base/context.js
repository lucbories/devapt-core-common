// NPM IMPORTS
import assert   from 'assert'
import fs       from 'fs'
import path     from 'path'
import mustache from 'mustache'

// COMMON IMPORTS
import T            from '../utils/types'
import {is_browser} from '../utils/is_browser'

/**
 * Cryptography library.
 * @private
 */
let  forge = undefined
if ( is_browser() )
{
	forge = require('forge-browser').forge
} else {
	forge = require('node-forge')
}


/**
 * Contextual constant for this file logs.
 * @private
 */
const context = 'common/base/context'



/**
 * Runtime context methods (browser/server, locales, i18n).
 * 
 * @author Luc BORIES
 * @license Apache-2.0
 * 
 * @example
 * 	API:
 * 		->constructor(arg_runtime):nothing - constructor.
 * 
 *  PATHS API:
 * 		->get_base_dir():string - Get project base directory, the root directory of the project.
 * 		->get_world_dir():string - Get topology  world resources directory, by default: the root directory of the project.
 * 
 * 		->get_absolute_path(arg_relative_path1, arg_relative_path2, arg_relative_path3):string - Get absolute path of given relative path.
 * 				Search strategy:
 * 				1-Joining given ordered paths
 * 				2-Joining base directory and given ordered paths
 * 				3-Joining world resources directory and given ordered paths
 * 
 * 		->get_absolute_plugin_path(arg_relative_plugin, arg_relative_path1, arg_relative_path2):string - Get absolute path of given relative plugin name.
 * 				Call get_absolute_path(arg_relative_plugin, arg_relative_path1, arg_relative_path2)
 * 
 * 		->get_absolute_package_path(arg_relative_pkg, arg_relative_path1, arg_relative_path2):string - Get absolute path of given relative package name.
 * 				Call get_absolute_path(arg_relative_pkg, arg_relative_path1, arg_relative_path2)
 * 				Call get_absolute_path( path.join('../../../node_modules', arg_relative_pkg), arg_relative_path1, arg_relative_path2)
 * 				Call get_absolute_path( path.join('../../node_modules', arg_relative_pkg), arg_relative_path1, arg_relative_path2)
 * 				Call get_absolute_path( path.join('../node_modules', arg_relative_pkg), arg_relative_path1, arg_relative_path2)
 * 				Call get_absolute_path( path.join('node_modules', arg_relative_pkg), arg_relative_path1, arg_relative_path2)
 * 
 * 		->get_absolute_public_path(arg_relative_public, arg_relative_path1, arg_relative_path2):string - Get absolute path of given relative public path.
 * 				Call get_absolute_path(arg_relative_public, arg_relative_path1, arg_relative_path2)
 * 				If not found, search with prefixes [base_public, world_public, 'public', '..', '../public', '../..', '../../public', '../../..', '../../../public']
 * 				Call get_absolute_path( join(prefix, arg_relative_public), arg_relative_path1, arg_relative_path2)
 * 
 * 		->get_absolute_resources_path(arg_relative_resource, arg_relative_path1, arg_relative_path2):string - Get absolute path of given relative resource file.
 * 				Call get_absolute_path( path.join('resources', arg_relative_resource), arg_relative_path1, arg_relative_path2)
 * 
 * 	CREDENTIALS API:
 * 		->get_credentials(arg_request):object - Get credentials.
 * 		->get_credentials_string(arg_credentials):string - Get credentials string as 'username=...&password=...&token=...'.
 * 		->get_url_with_credentials(arg_url, arg_request):string - Get given url augmented with credentials string.
 * 
 * 		->render_credentials_template(arg_html, arg_request_or_credentials):string - Render credentials template.
 * 				Call  mustache.render(arg_html, credentials_datas)
 * 				with const credentials_datas = credentials_obj.get_credentials_for_template()
 * 					credentials_datas.credentials_str = credentials_str
 * 					credentials_datas.credentials_url = credentials_url
 * 					credentials_datas.credentials_basic_base64 = base64_encoded
 * 					credentials_datas.url = '{{url}}'
 */
export default class Context
{
    /**
     * Create a context instance.
	 * 
     * @param {object} arg_runtime - current runtime.
	 * 
     * @returns {nothing}
     */
	constructor(arg_runtime)
	{
		assert( T.isObject(arg_runtime) && arg_runtime.is_server_runtime, context + ':bad runtime object')
		
		/**
		 * Class type flag.
		 * @type {boolean}
		 */
		this.is_context = true
		
		/**
		 * Runtime instance.
		 * @type {Runtime}
		 */
		this.$runtime = arg_runtime
	}
    
    
	
	// *************************************************** FILE PATH ********************************************************
	
	/**
	 * Get project base directory, the root directory of the project.
	 * 
	 * @returns {string} - absolute root directory path.
	 */
	get_base_dir()
	{
		return this.$runtime ? this.$runtime.get_setting('base_dir') : null
	}



	/**
	 * Get topology  world resources directory, by default: the root directory of the project.
	 * 
	 * @returns {string} - absolute root directory path.
	 */
	get_world_dir()
	{
		return this.$runtime ? this.$runtime.get_setting('world_dir') : this.get_base_dir()
	}
	

	
	/**
	 * Get absolute path of given relative path.
	 * 
	 * @param {string} arg_relative_path1 - relative path 1.
	 * @param {string} arg_relative_path2 - relative path 2.
	 * @param {string} arg_relative_path3 - relative path 3.
	 * 
	 * @returns {string} - absolute path.
	 */
	get_absolute_path(arg_relative_path1, arg_relative_path2, arg_relative_path3)
	{
		assert( T.isString(arg_relative_path1), context + ':get_absolute_path: bad paths strings')
		let base_dir = path.isAbsolute(arg_relative_path1) ? '' : this.get_base_dir()
		assert( T.isString(base_dir), context + ':get_absolute_path: bad base dir string')

		// console.log(this.get_world_dir(), 'world_dir')
		// console.log('get_absolute_path:with ', arg_relative_path1, arg_relative_path2, arg_relative_path3)

		const default_extension = '.js'
		let ext = undefined
		let p0 = undefined
		let p1 = undefined
		let p2 = undefined

		if ( T.isString(arg_relative_path2) )
		{
			if ( T.isString(arg_relative_path3) )
			{
				ext = path.extname(arg_relative_path3)
				p0 = path.join(arg_relative_path1, arg_relative_path2, arg_relative_path3)
				p1 = path.join(this.get_world_dir(), arg_relative_path1, arg_relative_path2, arg_relative_path3)
				p2 = path.join(base_dir, arg_relative_path1, arg_relative_path2, arg_relative_path3)
			}
			else
			{
				ext = path.extname(arg_relative_path2)
				p0 = path.join(arg_relative_path1, arg_relative_path2)
				p1 = path.join(this.get_world_dir(), arg_relative_path1, arg_relative_path2)
				p2 = path.join(base_dir, arg_relative_path1, arg_relative_path2)
			}
		}
		else
		{
			ext = path.extname(arg_relative_path1)
			p0 = arg_relative_path1
			p1 = path.join(this.get_world_dir(), arg_relative_path1)
			p2 = path.join(base_dir, arg_relative_path1)
		}
		// console.log('get_absolute_path:', p0, p1, p2)

		if ( path.isAbsolute(p0) )
		{
			// WITHOUT DEFAULT EXTENSION
			try
			{
				const fs_stat = fs.statSync(p0)
				if ( fs_stat.isFile() || fs_stat.isDirectory() )
				{
					// console.log(context + ':get_absolute_path:path found [%s] for [%s, %s, %s]', p0, arg_relative_path1, arg_relative_path2, arg_relative_path3)
					return p0
				}
			}
			catch(e) {}

			// WITH DEFAULT EXTENSION
			try
			{
				const fs_stat = fs.statSync(p0 + default_extension)
				if ( fs_stat.isFile() || fs_stat.isDirectory() )
				{
					// console.log(context + ':get_absolute_path:path found [%s] for [%s, %s, %s]', p0, arg_relative_path1, arg_relative_path2, arg_relative_path3)
					return p0 + default_extension
				}
			}
			catch(e) {}
		}

		if ( path.isAbsolute(p1) )
		{
			// WITHOUT DEFAULT EXTENSION
			try
			{
				const fs_stat = fs.statSync(p1)
				if ( fs_stat.isFile() || fs_stat.isDirectory() )
				{
					// console.log(context + ':get_absolute_path:path found [%s] for [%s, %s, %s]', p1, arg_relative_path1, arg_relative_path2, arg_relative_path3)
					return p1
				}
			}
			catch(e) {}

			// WITH DEFAULT EXTENSION
			try
			{
				const fs_stat = fs.statSync(p1 + default_extension)
				if ( fs_stat.isFile() || fs_stat.isDirectory() )
				{
					// console.log(context + ':get_absolute_path:path found [%s] for [%s, %s, %s] with .js', p1, arg_relative_path1, arg_relative_path2, arg_relative_path3)
					return p1 + default_extension
				}
			}
			catch(e) {}
		}

		if ( path.isAbsolute(p2) )
		{
			// WITHOUT DEFAULT EXTENSION
			try
			{
				const fs_stat = fs.statSync(p2)
				if ( fs_stat.isFile() || fs_stat.isDirectory() )
				{
					// console.log(context + ':get_absolute_path:path found [%s] for [%s, %s, %s]', p2, arg_relative_path1, arg_relative_path2, arg_relative_path3)
					return p2
				}
			}
			catch(e) {}

			// WITH DEFAULT EXTENSION
			try
			{
				const fs_stat = fs.statSync(p2 + default_extension)
				if ( fs_stat.isFile() || fs_stat.isDirectory() )
				{
					// console.log(context + ':get_absolute_path:path found [%s] for [%s, %s, %s] with .js', p2, arg_relative_path1, arg_relative_path2, arg_relative_path3)
					return p2 + default_extension
				}
			}
			catch(e) {}
		}

		
		// if (ext == '')
		// {
		// 	const path_1_is_directory = path.dirname(arg_relative_path1) == arg_relative_path1
		// 	const path_2_is_directory = path.dirname(arg_relative_path2) == arg_relative_path2
		// 	const path_3_is_directory = path.dirname(arg_relative_path3) == arg_relative_path3

		// 	const part_1 = (! path_1_is_directory && arg_relative_path1 && ! arg_relative_path2) ? arg_relative_path1 + '.js' : arg_relative_path1
		// 	const part_2 = (! path_2_is_directory && arg_relative_path2 && ! arg_relative_path3) ? arg_relative_path2 + '.js' : arg_relative_path2
		// 	const part_3 = arg_relative_path3 ? arg_relative_path3 + (! path_3_is_directory ? '.js' : '') : undefined

		// 	const absolute_path = this.get_absolute_path(part_1, part_2, part_3)
		// 	return absolute_path
		// }

		console.error(context + ':get_absolute_path:path not found [\n%s, \n%s, \n%s\n] for [\n%s, \n%s, \n%s\n]', p0, p1, p2, arg_relative_path1, arg_relative_path2, arg_relative_path3)
		return undefined
	}
	
	

	/**
	 * Get absolute path of given relative plugin name.
	 * 
	 * @param {string} arg_relative_plugin - plugin name.
	 * @param {string} arg_relative_path1 - relative path 1.
	 * @param {string} arg_relative_path2 - relative path 2.
	 * 
	 * @returns {string} - absolute path.
	 */
	get_absolute_plugin_path(arg_relative_plugin, arg_relative_path1, arg_relative_path2)
	{
		assert( T.isString(arg_relative_plugin), context + 'get_absolute_plugin_path: bad plugin name string')
		if ( path.isAbsolute(arg_relative_plugin) )
		{
			return this.get_absolute_path(arg_relative_plugin, arg_relative_path1, arg_relative_path2)
		}
		return this.get_absolute_path('plugins', arg_relative_plugin, arg_relative_path1, arg_relative_path2)
	}
	
	

	/**
	 * Get absolute path of given relative package name.
	 * 
	 * @param {string} arg_relative_pkg - package name.
	 * @param {string} arg_relative_path1 - relative path 1.
	 * @param {string} arg_relative_path2 - relative path 2.
	 * 
	 * @returns {string} - absolute path.
	 */
	get_absolute_package_path(arg_relative_pkg, arg_relative_path1, arg_relative_path2)
	{
		assert( T.isString(arg_relative_pkg), context + 'get_absolute_package_path: bad package name string')
		if ( path.isAbsolute(arg_relative_pkg) )
		{
			return this.get_absolute_path(arg_relative_pkg, arg_relative_path1, arg_relative_path2)
		}
		// debugger
		
		let p = this.get_absolute_path( path.join('../../../node_modules', arg_relative_pkg), arg_relative_path1, arg_relative_path2)
		// console.log('get_absolute_package_path:../../../node_modules:', p)
		if (p)
		{
			return p
		}
		
		p = this.get_absolute_path( path.join('../../node_modules', arg_relative_pkg), arg_relative_path1, arg_relative_path2)
		// console.log('get_absolute_package_path:../../../node_modules:', p)
		if (p)
		{
			return p
		}
		
		p = this.get_absolute_path( path.join('../node_modules', arg_relative_pkg), arg_relative_path1, arg_relative_path2)
		// console.log('get_absolute_package_path:../../../node_modules:', p)
		if (p)
		{
			return p
		}

		return this.get_absolute_path( path.join('node_modules', arg_relative_pkg), arg_relative_path1, arg_relative_path2)
	}
	
	

	/**
	 * Get absolute path of given relative public path.
	 * 
	 * @param {string} arg_relative_public - public path.
	 * @param {string} arg_relative_path1 - relative path 1.
	 * @param {string} arg_relative_path2 - relative path 2.
	 * 
	 * @returns {string} - absolute path.
	 */
	get_absolute_public_path(arg_relative_public, arg_relative_path1, arg_relative_path2)
	{
		assert( T.isString(arg_relative_public), context + 'get_absolute_public_path: bad path string')
		
		if ( path.isAbsolute(arg_relative_public) )
		{
			// console.log('get_absolute_public_path:absolute:', arg_relative_public)
			return this.get_absolute_path(arg_relative_public, arg_relative_path1, arg_relative_path2)
		}
		
		const base_public = path.join(this.get_base_dir(), 'public')
		const world_public = path.join(this.get_world_dir(), 'public')
		const searchs = [base_public, world_public, 'public', '..', '../public', '../..', '../../public', '../../..', '../../../public']
		// console.log('get_absolute_public_path:base_public:', base_public)
		// console.log('get_absolute_public_path:world_public:', world_public)

		let p = undefined
		let index = 0
		let prefix = undefined
		while( ! p && index < searchs.length )
		{
			prefix = searchs[index]
			p = this.get_absolute_path( path.join(prefix, arg_relative_public), arg_relative_path1, arg_relative_path2)
			// console.log('get_absolute_public_path:prefix=%s:', prefix, p)
			++index
		}
		
		return p
	}
	

	
	/**
	 * Get absolute path of given relative resource file.
	 * 
	 * @param {string} arg_relative_resource - resource file name.
	 * @param {string} arg_relative_path1 - relative path 1.
	 * @param {string} arg_relative_path2 - relative path 2.
	 * 
	 * @returns {string} - absolute path.
	 */
	get_absolute_resources_path(arg_relative_resource, arg_relative_path1, arg_relative_path2)
	{
		assert( T.isString(arg_relative_resource), context + 'get_absolute_resources_path: bad resource file string')
		return this.get_absolute_path( path.join('resources', arg_relative_resource), arg_relative_path1, arg_relative_path2)
	}
	
	
	

	// *************************************************** URL ********************************************************
	
    /**
     * Get credentials.
	 * 
     * @param {object} arg_request - request object.
	 * 
     * @returns {object} credentials plain object.
     */
	get_credentials(arg_request)
	{
		// logs.debug('get_credentials')

		const auth_mgr = this.$runtime ? this.$runtime.security().authentication() : null
		if (! auth_mgr)
		{
			return undefined
		}
		
		if ( ! arg_request )
		{
			return undefined
		}
		
		const credentials = auth_mgr.get_credentials(arg_request)
		return credentials
	}
	
	
	
    /**
     * Get credentials string.
	 * 
     * @param {object} arg_credentials - Credetials object.
	 * 
     * @returns {string} credentials string.
     */
	get_credentials_string(arg_credentials)
	{
		if (! arg_credentials)
		{
			return ''
		}
		
		// TODO: use security token
		return 'username=' + arg_credentials.get_user() + '&password=' + arg_credentials.get_pass_digest() + '&token=' + arg_credentials.get_token()
	}
	
	
	
    /**
     * Get given url augmented with credentials string.
	 * 
     * @param {string} arg_url - image asset relative url.
     * @param {object|Credentials} arg_request_or_credentials - request object or Credentials instance.
	 * 
     * @returns {string} absolute url.
     */
	get_url_with_credentials(arg_url, arg_request_or_credentials)
	{
		// logs.debug('get_url_with_credentials')
		
		
		// TODO ARGS = REQUEST OR CRENDETIALS ??

		// NO CREDENTIALS, NO REQUEST
		if ( ! arg_request_or_credentials )
		{
			return arg_url + '?{{credentials_url}}'
		}
	
		// GET CREDENTIALS
		const credentials = arg_request_or_credentials.is_credentials ? arg_request_or_credentials : (arg_request_or_credentials.credentials ? arg_request_or_credentials.credentials : undefined)
		
		// GET CREDENTIALS STRING
		const credentials_str = this.get_credentials_string(credentials)
		if (credentials_str)
		{
			return arg_url + '?' + credentials_str
		}
		
		return arg_url
	}
    
	
	
	/**
     * Render credentials template.
	 * 
     * @param {string} arg_html - template html string.
     * @param {Request|Credentials} arg_request_or_credentials - request object.
	 * 
     * @returns {string} rendered template.
     */
	render_credentials_template(arg_html, arg_request_or_credentials)
	{
		assert( T.isObject(arg_request_or_credentials), context + ':render_credentials_template:bad arg_request_or_credentials object')

		let credentials_obj = arg_request_or_credentials.is_credentials ? arg_request_or_credentials : this.get_credentials(arg_request_or_credentials)
		let credentials_str = this.get_credentials_string(credentials_obj)
		let credentials_url = this.get_credentials_string(credentials_obj)
		// console.log(credentials_str, 'credentials_str')
		
		
		// TODO 2 cases:
		/*
			url:string
			var:JSON.stringiy(object)
		*/
		
		
		
		if (credentials_str)
		{
			const base64_encoded = forge.util.encode64(credentials_obj.username + ':' + credentials_obj.password)

			const credentials_datas = credentials_obj.get_credentials_for_template()
			credentials_datas.credentials_str = credentials_str
			credentials_datas.credentials_url = credentials_url
			credentials_datas.credentials_basic_base64 = base64_encoded
			credentials_datas.url = '{{url}}'

			// 	credentials_token:credentials_obj.token,
			// 	credentials_user_name:credentials_obj.username,
			// 	credentials_pass_digest:credentials_obj.password,
				
			// 	credentials_login:credentials_obj.ts_login,
			// 	credentials_expire:credentials_obj.expire,

			// 	credentials_basic_base64:base64_encoded
			// 	// credentials_obj: `{ \"username\":\"${credentials_obj.username}\", "password":"${credentials_obj.password}" }`
			// }
			return mustache.render(arg_html, credentials_datas)
		}
		
		return arg_html
	}
	
	
    
	// TODO:TO CLEAN OR IMPLEMENT
	// get_relative_url(arg_url)
    // {
	// 	return arg_url
	// }
    
    
	// get_absolute_url(arg_url)
	// {
	// 	return arg_url
	// }


	// get_absolute_plugin_url(arg_plugin)
	// {
	// 	return arg_plugin
	// }
}