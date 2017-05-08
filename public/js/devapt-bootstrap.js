
// DECORATE WINDOW WITH DEVAPT
var private_devapt = {
	runtime_created_listeners:[],
	content_rendered_listeners:[],
	content_rendered_persistent_listeners:[],
	runtime:undefined,
	asset_promise:undefined,
	ui:undefined,
	service:undefined,
	router:undefined,
	ajax:undefined
}

window.devapt = function() { return private_devapt }



// *********************************************************************************
// ON DOM LOADED HANDLER
function dom_loaded_listener(arg_callback, arg_operand)
{
	// console.log('devapt-bootstrap:dom_loaded_listener')

	var cb = function()
	{
		// console.info('devapt-bootstrap:dom_loaded_listener:cb')

		document.removeEventListener("DOMContentLoaded", cb, false);

		arg_callback(arg_operand);

		if (document.body.className.indexOf('javascript') == -1)
		{
			document.body.className += ' javascript';
		}
	}

	return cb
}


private_devapt.on_dom_loaded = function(arg_callback, arg_operand)
{
	// console.log('devapt-bootstrap:on_dom_loaded')

	document.onreadystatechange = function ()
	{
		console.info('devapt-bootstrap:on_dom_loaded:state changes:' + document.readyState)

		if (document.readyState == 'complete')
		{
			console.info('devapt-bootstrap:on_dom_loaded:dom is loaded')
			arg_callback(arg_operand)
		}
	}
	
	//  else {
	// 	console.info('devapt-bootstrap:on_dom_loaded:not loaded')

	// 	// Mozilla, Opera, Webkit, IE9+
	// 	if (document.addEventListener)
	// 	{
	// 		var cb = dom_loaded_listener(arg_callback, arg_operand)
	// 		document.addEventListener("DOMContentLoaded", cb, false)
	// 	}
	// }
}



// *********************************************************************************
// CREATE RUNTIME
private_devapt.create_runtime = function()
{
	console.info('devapt-bootstrap:create_runtime')
	
	function reducers(prev_state/*, action*/)
	{
		if (! prev_state)
		{
			prev_state = {}
		}
		if (! prev_state.counter)
		{
			prev_state.counter = 0
		}
		prev_state.counter++
		
		// console.log(prev_state, 'state')
		
		return prev_state
	}

	// CREATE RUNTIME
	var runtime_settings = {
		reducers:reducers,
		default_view:"${arg_default_view}",
		default_menubar:"${arg_default_menubar}",
		app_state_strategy:{
			source:'html', // 'browser' or 'session' or 'html',
			save_period:5000, // milliseconds between two state save
			state_key:'__DEVAPT_APP_STATE_KEY__'
		}
	}
	var ClientRuntime = require('client_runtime').default
	var private_runtime = new ClientRuntime()
	
	// RUNTIME GETTER
	private_devapt.runtime = function() { return private_runtime }
	
	// LOAD RUNTIME
	private_runtime.load(runtime_settings)
	
	// ROUTER GETTER
	private_devapt.router = function() { return private_runtime._router }

	// UI GETTER
	var private_ui = private_runtime._ui
	private_devapt.ui = function(arg_name)
	{
		if (arg_name)
		{
			return private_ui.get(arg_name)
		}
		return private_ui
	}

	// SERVICE GETTER
	private_devapt.service = function(arg_name)
	{
		if (arg_name)
		{
			return private_runtime.service(arg_name)
		}
		return undefined
	}

	// COMMAND GETTER
	private_devapt.command = function(arg_name)
	{
		if (arg_name)
		{
			return private_runtime.command(arg_name)
		}
		return undefined
	}

	private_devapt.runtime_created()
}


private_devapt.on_runtime_created = function(arg_callback, arg_operand)
{
	// console.log('devapt-bootstrap:on_runtime_created')

	private_devapt.runtime_created_listeners.push( { callback:arg_callback, operands:arg_operand})
}


private_devapt.runtime_created = function()
{
	console.info('devapt-bootstrap:runtime_created')

	private_devapt.runtime_created_listeners.forEach(
		function(cb_record)
		{
			cb_record.callback(cb_record.operands)
		}
	)
}



// *********************************************************************************
// RENDER PAGE CONTENTT
private_devapt.render_page_content = function(arg_operand)
{
	console.info('devapt-bootstrap:render_page_content')
	
	var json_result = arg_operand ? arg_operand : window.__INITIAL_CONTENT__ 
	// console.log(json_result, 'js-devapt-init-content')
	
	if (json_result && json_result.rendering_result)
	{
		const cmd_settings = {
			name:'devapt-bootstrap:render_page_content',
			type:'display',
			rendering_result:json_result
		}

		const cmd = window.devapt().ui().create_display_command(cmd_settings)
		window.devapt().ui().pipe_display_command(cmd)
	}

	window.devapt().router().set_hash_if_empty('/')
}


// ON RUNTIME CREATED HANDLER
private_devapt.on_content_rendered = function(arg_callback, arg_operand, arg_persistent)
{
	arg_persistent = arg_persistent ? arg_persistent : false
	// console.log('devapt-bootstrap:on_content_rendered')

	if (arg_persistent)
	{
		private_devapt.content_rendered_persistent_listeners.push( { callback:arg_callback, operands:arg_operand})
		return
	}

	private_devapt.content_rendered_listeners.push( { callback:arg_callback, operands:arg_operand})
}


// ON RUNTIME CREATED HANDLER
private_devapt.content_rendered = function()
{
	console.info('devapt-bootstrap:content_rendered')

	private_devapt.content_rendered_listeners.forEach(
		function(cb_record)
		{
			cb_record.callback(cb_record.operands)
		}
	)

	private_devapt.content_rendered_listeners = []

	private_devapt.content_rendered_persistent_listeners.forEach(
		function(cb_record)
		{
			cb_record.callback(cb_record.operands)
		}
	)
}



// *********************************************************************************
// UPDATE ANCHORS WITH COMMANDS ATTRIBUTES
private_devapt.init_anchors_commands = function()
{
	console.info('devapt-bootstrap:init_anchors_commands')

	var label = undefined
	var href = undefined
	var cmd = undefined
	var cmd_name = undefined
	var anchors = document.querySelectorAll('a.devapt-command')
	anchors.forEach(
		function(anchor)
		{
			label = anchor.text

			href = anchor.getAttribute('href')
			cmd_name = anchor.getAttribute('data-devapt-command')
			cmd = window.devapt().command(cmd_name)
			if (cmd)
			{
				// UPDATE ANCHOR LABEL
				if (label == 'no label' && cmd.label && cmd.label.length > 0)
				{
					anchor.innerHTML = cmd.label
				}

				// UPDATE ANCHOR HREF
				if (href == '#' && cmd.url && cmd.url.length > 0)
				{
					anchor.setAttribute('href', '#' + cmd.url)
				}
			}
		}
	)
}



// *********************************************************************************
// UPDATE ANCHORS WITH COMMANDS ATTRIBUTES
private_devapt.init_app_state_save = function()
{
	console.info('devapt-bootstrap:init_app_state_save')

	var runtime = private_devapt.runtime()
	if (! runtime)
	{
		console.error('devapt-bootstrap:init_app_state_save:no runtime')
		return
	}

	runtime.init_app_state_save()
}



// *********************************************************************************
// MONITOR ASSET LOADING WITH A PROMSE FOR ASSETS DEPENDENCIES
var private_asset_promises = {}
private_devapt.monitor_asset_loading = function(arg_tag, arg_id, arg_url, arg_elem)
{
	if (arg_id in private_asset_promises)
	{
		return private_asset_promises[arg_id]
	}
	var promise_cb = function(resolve, reject)
	{
		arg_elem.onload = function(){
			console.info('ASSET loaded tag=%s, id=%s, url=%s', arg_tag, arg_id, arg_url)
			resolve('ASSET loaded tag=' + arg_tag + ', id=' + arg_id + ', url=' + arg_url)
		}

		arg_elem.onerror = function(){
			console.error('ASSET loading error tag=%s, id=%s, url=%s', arg_tag, arg_id, arg_url)
			reject('ASSET loading error tag=' + arg_tag + ', id=' + arg_id + ', url=' + arg_url)
		}
	}
	private_asset_promises[arg_id] = new Promise(promise_cb)
	console.info('ASSET init event for tag=%s, id=%s, url=%s', arg_tag, arg_id, arg_url)
	return private_asset_promises[arg_id]
}
// ASSET PROMISE GETTER
private_devapt.asset_promise = function(arg_asset_id)
{
	if (arg_asset_id in private_asset_promises)
	{
		return private_asset_promises[arg_asset_id]
	}
	return Promise.reject('asset promise not found for [' + arg_asset_id + ']')
}
// INIT SCRIPTS ASSETS MONITORING
private_devapt.init_scripts_load_events = function()
{
	console.info('devapt-bootstrap:init_scripts_load_events')

	var scripts = document.getElementsByTagName('script')
	var i = 0
	for( ; i < scripts.length ; i++)
	{
		var e = scripts[i]
		var tag = e.tagName
		var id = e.getAttribute('id')
		var url = e.getAttribute('src')
		private_devapt.monitor_asset_loading(tag, id, url, e)
	}
}



// *********************************************************************************
// AJAX
private_devapt.ajax = function() { return private_devapt.private_ajax }
private_devapt.private_ajax = {}

private_devapt.private_ajax.get_html = function (arg_url, arg_callback)
{
	console.log('devapt-bootstrap:ajax_get')

	var xhr = new XMLHttpRequest();
	xhr.open('GET', arg_url);
	xhr.send(null);

	xhr.onreadystatechange = function ()
	{
		var DONE = 4;
		var OK   = 200;
		if (xhr.readyState === DONE)
		{
			if (xhr.status === OK) 
			{
				console.log(xhr.responseText);
				arg_callback(xhr.responseText);
			} else {
				console.error('Error: ' + xhr.status);
			}
		}
	}
}

private_devapt.private_ajax.get_json = private_devapt.private_ajax.get_html



// *********************************************************************************
// SERVICES HELPERS
function devapt_get_service(arg_svc_name, arg_svc_cfg)
{
	var devapt = window.devapt()
	var rt = devapt.runtime()
	var svc_promise = rt.register_service(arg_svc_name, arg_svc_cfg)

	return svc_promise.then(
		function(svc)
		{
			console.log('service [' + arg_svc_name + '] is ready')
			return svc
		}
	)
}


function devapt_subscribe_service(arg_svc_promise, arg_operands=undefined, arg_callback=undefined)
{
	arg_svc_promise.then(
		function(svc)
		{
			// SUBSCRIBE TO POST
			var method = 'post'

			if ( ! (method in svc) )
			{
				console.error('method [post] not found for service [' + svc.get_name() + ']')
				return
			}

			var result_stream = svc[method](arg_operands)
			var unsubscribe = result_stream.subscribe(
				function(response)
				{
					console.log('service [' + svc.get_name() + '] receive method [' + method + '] response', response)
					
					if (arg_callback)
					{
						arg_callback(response)
					}
				}
			)
			
			if (! svc['post'].unsubscribes )
			{
				svc['post'].unsubscribes = []
			}
			svc['post'].unsubscribes.push(unsubscribe)

			console.log(method + ' subscribed for service [' + svc.get_name() + ']')
		}
	)
}


function devapt_request_service(arg_svc_promise, arg_operation, arg_operands=undefined, arg_callback=undefined)
{
	if (! arg_svc_promise || ! arg_svc_promise.then)
	{
		console.error('devapt_request_service:bad service promise')
		return
	}

	if (! arg_operation)
	{
		console.error('devapt_request_service:bad operation name')
		return
	}

	arg_svc_promise.then(
		function(svc)
		{
			// CHECK SERVICE AND METHOD
			if ( ! svc)
			{
				console.error('devapt_request_service:bad service [' + svc.get_name() + ']')
				return
			}
			if ( ! (arg_operation in svc) )
			{
				console.error('devapt_request_service:method [' + arg_operation + '] not found for service [' + svc.get_name() + ']', svc)
				return
			}

			// REQUEST METHOD
			var result_stream = svc[arg_operation](arg_operands)
			var unsubscribe = result_stream.subscribe(
				function(response)
				{
					console.log('devapt_request_service:service [' + svc.get_name() + '] receive method [' + arg_operation + '] response', response)
					
					if (arg_callback)
					{
						arg_callback(response)
					}

					unsubscribe()
				}
			)
			console.log('devapt_request_service:' + arg_operation + ' requested for service [' + svc.get_name() + ']')
			
			return result_stream
		}
	)
	.catch(
		function(reason)
		{
			console.error('devapt_request_service:' + arg_operation + ' not found for reason:', reason)
		}
	)
}



// *********************************************************************************
// STARTING DEVAPT
window.devapt().init_scripts_load_events()
window.devapt().on_dom_loaded( window.devapt().create_runtime )

window.devapt().on_content_rendered(
	function()
	{
		var socket = io()
		window.onbeforeunload = function(/*e*/)
		{
			socket.emit('end')
			socket.disconnect()
		}
	}
)

window.devapt().on_runtime_created( window.devapt().render_page_content )
window.devapt().on_content_rendered( window.devapt().init_anchors_commands )
window.devapt().on_content_rendered( window.devapt().init_app_state_save )


