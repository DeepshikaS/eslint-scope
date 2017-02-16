// -*- coding: utf-8 -*-
//  Copyright (C) 2014 Yusuke Suzuki <utatane.tea@gmail.com>
//
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//    * Redistributions of source code must retain the above copyright
//      notice, this list of conditions and the following disclaimer.
//    * Redistributions in binary form must reproduce the above copyright
//      notice, this list of conditions and the following disclaimer in the
//      documentation and/or other materials provided with the distribution.
//
//  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
//  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
//  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
//  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
//  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
//  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
//  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
//  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
//  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
//  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
"use strict";

const expect = require("chai").expect;
const espree = require("../third_party/espree");
const analyze = require("..").analyze;

describe("export declaration", function() {
    // http://people.mozilla.org/~jorendorff/es6-draft.html#sec-static-and-runtme-semantics-module-records
    it("should create vairable bindings", function() {
        const ast = espree("export var v;", {sourceType: "module"});

        const scopeManager = analyze(ast, {ecmaVersion: 6, sourceType: "module"});
        expect(scopeManager.scopes).to.have.length(2);
        const globalScope = scopeManager.scopes[0];
        expect(globalScope.type).to.be.equal("global");
        expect(globalScope.variables).to.have.length(0);
        expect(globalScope.references).to.have.length(0);

        const scope = scopeManager.scopes[1];
        expect(scope.type).to.be.equal("module");
        expect(scope.variables).to.have.length(1);
        expect(scope.variables[0].name).to.be.equal("v");
        expect(scope.variables[0].defs[0].type).to.be.equal("Variable");
        expect(scope.references).to.have.length(0);
    });

    it("should create function declaration bindings", function() {
        const ast = espree("export default function f(){};", {sourceType: "module"});

        const scopeManager = analyze(ast, {ecmaVersion: 6, sourceType: "module"});
        expect(scopeManager.scopes).to.have.length(3);
        const globalScope = scopeManager.scopes[0];
        expect(globalScope.type).to.be.equal("global");
        expect(globalScope.variables).to.have.length(0);
        expect(globalScope.references).to.have.length(0);

        let scope = scopeManager.scopes[1];
        expect(scope.type).to.be.equal("module");
        expect(scope.variables).to.have.length(1);
        expect(scope.variables[0].name).to.be.equal("f");
        expect(scope.variables[0].defs[0].type).to.be.equal("FunctionName");
        expect(scope.references).to.have.length(0);

        scope = scopeManager.scopes[2];
        expect(scope.type).to.be.equal("function");
        expect(scope.variables).to.have.length(1);
        expect(scope.variables[0].name).to.be.equal("arguments");
        expect(scope.references).to.have.length(0);
    });


    it("should export function expression", function() {
        const ast = espree("export default function(){};", {sourceType: "module"});

        const scopeManager = analyze(ast, {ecmaVersion: 6, sourceType: "module"});
        expect(scopeManager.scopes).to.have.length(3);
        const globalScope = scopeManager.scopes[0];
        expect(globalScope.type).to.be.equal("global");
        expect(globalScope.variables).to.have.length(0);
        expect(globalScope.references).to.have.length(0);

        let scope = scopeManager.scopes[1];
        expect(scope.type).to.be.equal("module");
        expect(scope.variables).to.have.length(0);
        expect(scope.references).to.have.length(0);

        scope = scopeManager.scopes[2];
        expect(scope.type).to.be.equal("function");
        expect(scope.variables).to.have.length(1);
        expect(scope.variables[0].name).to.be.equal("arguments");
        expect(scope.references).to.have.length(0);
    });

    it("should export literal", function() {
        const ast = espree("export default 42;", {sourceType: "module"});

        const scopeManager = analyze(ast, {ecmaVersion: 6, sourceType: "module"});
        expect(scopeManager.scopes).to.have.length(2);
        const globalScope = scopeManager.scopes[0];
        expect(globalScope.type).to.be.equal("global");
        expect(globalScope.variables).to.have.length(0);
        expect(globalScope.references).to.have.length(0);

        const scope = scopeManager.scopes[1];
        expect(scope.type).to.be.equal("module");
        expect(scope.variables).to.have.length(0);
        expect(scope.references).to.have.length(0);
    });

    it("should refer exported references#1", function() {
        const ast = espree("export {x};", {sourceType: "module"});

        const scopeManager = analyze(ast, {ecmaVersion: 6, sourceType: "module"});
        expect(scopeManager.scopes).to.have.length(2);
        const globalScope = scopeManager.scopes[0];
        expect(globalScope.type).to.be.equal("global");
        expect(globalScope.variables).to.have.length(0);
        expect(globalScope.references).to.have.length(0);

        const scope = scopeManager.scopes[1];
        expect(scope.type).to.be.equal("module");
        expect(scope.variables).to.have.length(0);
        expect(scope.references).to.have.length(1);
        expect(scope.references[0].identifier.name).to.be.equal("x");
    });

    it("should refer exported references#2", function() {
        const ast = espree("export {v as x};", {sourceType: "module"});

        const scopeManager = analyze(ast, {ecmaVersion: 6, sourceType: "module"});
        expect(scopeManager.scopes).to.have.length(2);
        const globalScope = scopeManager.scopes[0];
        expect(globalScope.type).to.be.equal("global");
        expect(globalScope.variables).to.have.length(0);
        expect(globalScope.references).to.have.length(0);

        const scope = scopeManager.scopes[1];
        expect(scope.type).to.be.equal("module");
        expect(scope.variables).to.have.length(0);
        expect(scope.references).to.have.length(1);
        expect(scope.references[0].identifier.name).to.be.equal("v");
    });

    it("should not refer exported references from other source#1", function() {
        const ast = espree("export {x} from \"mod\";", {sourceType: "module"});

        const scopeManager = analyze(ast, {ecmaVersion: 6, sourceType: "module"});
        expect(scopeManager.scopes).to.have.length(2);
        const globalScope = scopeManager.scopes[0];
        expect(globalScope.type).to.be.equal("global");
        expect(globalScope.variables).to.have.length(0);
        expect(globalScope.references).to.have.length(0);

        const scope = scopeManager.scopes[1];
        expect(scope.type).to.be.equal("module");
        expect(scope.variables).to.have.length(0);
        expect(scope.references).to.have.length(0);
    });

    it("should not refer exported references from other source#2", function() {
        const ast = espree("export {v as x} from \"mod\";", {sourceType: "module"});

        const scopeManager = analyze(ast, {ecmaVersion: 6, sourceType: "module"});
        expect(scopeManager.scopes).to.have.length(2);
        const globalScope = scopeManager.scopes[0];
        expect(globalScope.type).to.be.equal("global");
        expect(globalScope.variables).to.have.length(0);
        expect(globalScope.references).to.have.length(0);

        const scope = scopeManager.scopes[1];
        expect(scope.type).to.be.equal("module");
        expect(scope.variables).to.have.length(0);
        expect(scope.references).to.have.length(0);
    });

    it("should not refer exported references from other source#3", function() {
        const ast = espree("export * from \"mod\";", {sourceType: "module"});

        const scopeManager = analyze(ast, {ecmaVersion: 6, sourceType: "module"});
        expect(scopeManager.scopes).to.have.length(2);
        const globalScope = scopeManager.scopes[0];
        expect(globalScope.type).to.be.equal("global");
        expect(globalScope.variables).to.have.length(0);
        expect(globalScope.references).to.have.length(0);

        const scope = scopeManager.scopes[1];
        expect(scope.type).to.be.equal("module");
        expect(scope.variables).to.have.length(0);
        expect(scope.references).to.have.length(0);
    });
});

// vim: set sw=4 ts=4 et tw=80 :
