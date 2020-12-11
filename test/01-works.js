/* eslint-disable prefer-arrow-callback */
const {expect} = require("chai");
const emptyObject = {};
Object.freeze(emptyObject);
const unsafeProperties = Object.getOwnPropertyNames(Object.prototype);
const {isSafeProperty, stripUnsafeProperties} = require("../index");

describe("Safify Object:", function(){
	if(process.env.NYC_CONFIG == null && process.env.TEST_EVERYTHING == null && process.env.VSCODE_IPC_HOOK == null){
		before(function(){
			this.skip();
		});
	}
	it("tells us if a property name is safe", function(){
		const unsafeTest = unsafeProperties.concat("aHappyProperty", "anotherHappyProperty");
		const expectedResult = unsafeProperties.map(() => false).concat([true, true]);
		expect(unsafeTest.map(prop => isSafeProperty(prop))).to.deep.equal(expectedResult);
	});
	it("returns the same object given", function(){
		const obj = {};
		const returnedObject = stripUnsafeProperties(obj);
		expect(obj).to.equal(returnedObject);
	});
	it("strips out evil and mean properties", function(){
		const happyObject = {
			aHappyProperty: true,
			anotherHappyProperty: "😊"
		};
		/* I probably could have used Object.defineProperty instead of JSON.prase in order to make sure that __proto__
		   is the objects "own property", but w/e */
		const evilObject = Object.assign(JSON.parse("{\"__proto__\":{\"evil\":\"😈\"}}"), happyObject);
		unsafeProperties.forEach(prop => {
			if(prop === "__proto__"){
				/* The only effect of assinging the __proto__ property at runtime is changing the prototype of that one
				   particular object, and that is done */
				return;
			}
			evilObject[prop] = {evil: "😈"};
		});
		const sterilizedObject = stripUnsafeProperties(evilObject, false);
		unsafeProperties.forEach(prop => {
			expect(sterilizedObject[prop]).to.equal(emptyObject[prop]);
		});
		expect(sterilizedObject).to.deep.equal(happyObject);
	});
	it("strips out even and mean properties recursively", function(){
		const happyObject = {
			aHappyProperty: true,
			anotherHappyProperty: "😊",
			nestedObject: {anEvenHappierProperty: "😁"}
		};
		const evilObject = JSON.parse(JSON.stringify(happyObject));
		/* Note that if configurable is false, there's no way to delete the potentially evil property
		   Which means, you shouldn't call Object.definePropert(y|ies) with untrusted input */
		Object.defineProperty(evilObject.nestedObject, "__proto__", {configurable: true, value: {evil: "😈"}});
		unsafeProperties.forEach(prop => {
			if(prop === "__proto__"){
				return;
			}
			evilObject.nestedObject[prop] = {evil: "😈"};
		});
		const sterilizedObject = stripUnsafeProperties(evilObject, true);
		unsafeProperties.forEach(prop => {
			expect(sterilizedObject.nestedObject[prop]).to.equal(emptyObject[prop]);
		});
		expect(sterilizedObject).to.deep.equal(happyObject);
	});
	it("can enforce the prototypes of objects", function(){
		const object = {property: "aaaaaa"};
		Object.setPrototypeOf(object, {aaaa: "aaaa"});
		stripUnsafeProperties(object, false, Object.prototype, true);
		expect(Object.getPrototypeOf(object)).to.equal(Object.prototype);
	});
	it("throws an exception if an unsafe property cannot be deleted", function(){
		const evilObject = {};
		Object.defineProperty(evilObject, "toString", {
			configurable: false,
			value: "I'm going to cause a DOS, MWUHAHAHAHA!"
		});
		expect(stripUnsafeProperties.bind(global, evilObject)).to.throw("Cannot delete property toString");
	});
	it("doesn't hang on circular objects", function(){
		const object = {};
		object.object = object;
		stripUnsafeProperties(object);
	});
});
