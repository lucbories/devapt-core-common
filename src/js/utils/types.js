
// Similar to typr module which has a problem with recent nodejs: lib-cov not found error.

var toStr = Object.prototype.toString
const types_fn = {}



const types = ['Function', 'Object', 'Date', 'Number', 'String', 'Boolean', 'RegExp', 'Arguments']
types.forEach(
	(type)=>{
		const expected = '[object ' + type + ']'
		types_fn['is' + type] = (o)=>{
			return toStr.call(o) === expected
		}
	}
)


types_fn.isNotEmptyString = (o)=>{
	return types_fn.isString(o) && o.length > 0
}


types_fn.isStringOrNumber = (o)=>{
	return types_fn.isString(o) || types_fn.isNumber(o)
}


types_fn.isNotEmptyStringOrNumber = (o)=>{
	return types_fn.isNotEmptyString(o) || types_fn.isNumber(o)
}


types_fn.isNotEmptyArray = (o)=>{
	return types_fn.isArray(o) && o.length > 0
}


types_fn.isClass = (o)=>{
	return types_fn.isFunction(o) /*&& types_fn.isFunction(o.constructor)*/ // TODO ENHANCE CLASS CHECKING
}


// DOM ELEMENT TEST
// For a tr element: "[object HTMLTableRowElement]"
types_fn.isElement = (o)=>{
	if (typeof o != 'object')
	{
		return false
	}
	const str = o.toString()
	return str.startsWith('[object HTML') && str.endsWith('Element]')
}


// DOM NODE LIST TEST
// For a tr element: "[object NodeList]"
types_fn.isNodeList = (o)=>{
	if (typeof o != 'object')
	{
		return false
	}
	const str = o.toString()
	return str == '[object NodeList]'
}


types_fn.isArray = Array.isArray
types_fn.isNaN = Number.isNaN
types_fn.isNumeric = Number.isFinite

types_fn.isInfinite = (n)=>{
	return Math.abs(n) === Infinity
}

types_fn.isNull = (o)=>{
	return o === null
}

types_fn.isUndefined = (o)=>{
	var undef
	return o === undef
}

export default types_fn
