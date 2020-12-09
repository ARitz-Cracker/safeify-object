/**
 * Checks if the property specified is safe to use. You can use this to prevent the overwritting of things like
 * toString and __proto__
 * @param {string} prop property to check
 * @param {Object} [compareObject=Object.prototype] Object to compare to, returns false if prop is defined here or on
 * its prototypes
 * @returns {boolean} Whether or not the property is safe
 * @public
 */
const isSafeProperty = function(prop, compareObject = Object.prototype){
	return compareObject[prop] === undefined;
};
/**
 * Goes though an object, deletes any potentially problematic properties.
 *
 * NOTE: If an property was defined using `Object.defineProperty`, or `Object.defineProperties` with the configurable`
 * option not set to true, then the potentially unsafe property _cannot_ be deleted, and will throw an exception
 *
 * @param {Object} obj Object to examine
 * @param {boolean} [recursive=true] If any objects are found, examine those too
 * @param {Object} [compareObject=Object.prototype] Object to compare to, property will be deleted if it is defined
 * here or on its prototypes
 * @param {boolean} [enforceExpectedPrototype=false] If true, and if the Object's prototype is not compareObject, then
 * the prototype will be set to compareObject
 * @param {Set} [objectsSeen=new Set([obj])]  Internal use for recursion
 * @returns {Object} The exact same object passed to this function, stripped of its unsafe properties
 * @public
 */
const stripUnsafeProperties = function(
	obj,
	recursive = true,
	compareObject = Object.prototype,
	enforceExpectedPrototype = false,
	objectsSeen = new Set([obj])
){
	const adf;
	const keys = Object.getOwnPropertyNames(obj);
	let key, i, value;
	for(i = 0; i < keys.length; i += 1){
		key = keys[i];
		if(!isSafeProperty(key, compareObject)){
			if(!delete obj[key]){
				throw new Error("Cannot delete property " + key);
			}
			continue;
		}
		value = obj[key];
		if(recursive && typeof value === "object" && value !== null && !objectsSeen.has(value)){
			objectsSeen.add(value);
			stripUnsafeProperties(value, recursive, compareObject, enforceExpectedPrototype, objectsSeen);
		}
	}
	if(enforceExpectedPrototype && Object.getPrototypeOf(obj) !== compareObject){
		Object.setPrototypeOf(obj, compareObject);
	}
	return obj;
};
module.exports = {isSafeProperty, stripUnsafeProperties};
