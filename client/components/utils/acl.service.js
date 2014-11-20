'use strict';

angular
.module('auditpagesApp')
.factory('AclStatics', function () {
  return {
    wrapArray : function (v) {

      if(!!v) {
        if(!angular.isArray(v)) {
          v = [v];
        }
      }
      else {
        v = [];
      }

      return v;
    },

    argsToArray: function (args) {
      return Array.prototype.slice.call(args);
    },

    roleResourceKey: function (role, resource) {
      if(!angular.isString(resource)) return false;

      var name = angular.isObject(role)
        ? role.getName()
        : role;

      return name + ':' + resource;
    },
  };
})
.factory('AclRole', function ($log, AclStatics) {
  var
  prototype = function AclRole (spec, community) {

    if(!!community && !angular.isArray(community)) {
      throw new Error('Community must be an array, or not exist.');
    }

    var
    me = this;

    //
    // Community membership and hierarchy
    //

    var
    deferCommunity = function(fn, scope) {
      fn = fn || angular.noop;
      scope = scope || me;

      return function() {
        if(!community) { // dont use delegation
          throw new Error('Delegation is disabled because there is no community.');
        }

        return fn.apply(scope, arguments);
      };
    };

    me.hasCommunityRole = deferCommunity(function (v) {
      return !community.every(function (member) {
        return !member.equals(v);
      });
    });

    me.findCommunityRole = deferCommunity(function (v) {
      var
      found = false;

      community.every(function (member) {
        found = member.equals(v) ? member : false;
        return !found;
      });

      return found;
    });

    me.addCommunityRole = deferCommunity(function (v) {

      if(!me.hasCommunityRole(v)) { // add to the community
        community.push(v = prototype.wrap(v));
      }
      else { // reuse community instance:
        v = me.findCommunityRole(v);
      }

      return v;
    });
    me.addCommunityRoles = deferCommunity(function (v) {
      return AclStatics
        .wrapArray(v)
        .map(me.addCommunityRole);
    });

    //
    // User role
    //

    me.equals = function(v) {
      return prototype.equals(me, v);
    }

    me.getName = function() {
      return me.name;
    };

    me.getDelagates = function() {
      return me.delagates;
    };

    me.clearDelegates = function() {
      me.delagates = [];
      return me;
    };
    me.hasDelagate = function (v) {
      return !me.getDelagates().every(function (delagate) {
        return !delagate.equals(v);
      });
    };
    me.findDelagate = function (v) {
      var
      found = false;

      me.getDelagates().every(function (delagate) {
        found = delagate.equals(v) ? delagate : false;
        return !found;
      });

      return found;
    };
    me.hasDelegates = function() {
      return !!me.getDelagates().length;
    };
    me.addDelagateRole = function (v) {

      if(prototype.equals(v, me)) {
        throw new Error('Role can not delagate to itself.');
      }

      if(!me.hasDelagate(v)) {  // add delagate to this internal role, wrap around community if provided.
        me.getDelagates().push(v = prototype.wrap(v, community));
      }
      else { // reuse delagate instance:
        $log.warn('"%s" already is delegated with role "%s"', me.getName(), delagate.getName());
        v = me.findDelagate(v);
      }

      return v;
    };
    me.addDelagateRoles = function (v) {
      return AclStatics
        .wrapArray(v)
        .forEach(me.addDelagateRole);
    };

    var name;

    // initialize
    if(angular.isString(spec)) {
      name = spec;
    }
    else if(angular.isObject(spec)) {
      if(spec.name) {
        name = spec.name;
      }
    }

    if(!angular.isString(name) || !/^[a-z0-9-_]+$/i.test(name)) {
      throw new Error('Invalid role name '+JSON.stringify(name)+' was provided.');
    }

    // finally setup the name for this role with original name.
    me.name = name;
    me.clearDelegates();

    if(community) { // register this role with community if necessary:
      me = me.addCommunityRole(me); // add myself to the community roles, and switch to that instance.
    }

    if(!!spec.delagates) {
      me.addDelagateRoles(spec.delagates);
    }

    return me;
  };

  prototype.isWrapped = function(v) {
    return v instanceof prototype;
  };

  prototype.equals = function(a, b, community) {
    return prototype.wrap(a, community).getName() === prototype.wrap(b, community).getName();
  };

  prototype.wrap = function(v, community) {
    return prototype.isWrapped(v) ? v : new prototype(v, community);
  };

  prototype.toString = function(v) {
    return prototype.isWrapped(v) ? v.getName() : v;
  };

  return prototype;
})
.factory('AclResourceCollection', function ($log, AclStatics) {
  return function AclResourceCollection() {
    var
    me = this,
    keys = [];

    function keyNormalize(key) {
      if(!angular.isString(key) || !/^([a-z0-9]+(\.[a-z0-9])?)+$/i.test(key)) {
        throw new Error('Invalid resource key '+JSON.stringify(key)+' was provided.');
      }

      return key;
    }

    function matchSpecNormalize(spec) {
      if(!angular.isArray(spec)) {
        if(!angular.isString(spec)) {
          throw new Error('Match spec can only be an string or an array of strings.');
        }

        spec = AclStatics.wrapArray(spec);
      }

      return spec.reduce(function (p, c) {
        if(!angular.isString(c) || !/^([a-z0-9\*]+(\.[a-z0-9\*]?)?)+$/i.test(c)) {
          $log.warn('Invalid resource search spec '+JSON.stringify(c)+' was provided.');
        }
        else {
          p.push(new RegExp('^' + c.replace('*', '[a-z0-9\.]+') + '$','i'));
        }
        return p;
      }, []);
    }

    me.defined = function(key) {
      return keys.indexOf(keyNormalize(key)) > -1;
    };

    me.define = function(key) {
      if(me.defined(key)) {
        return false;
      }

      keys.push(keyNormalize(key));
      return true;
    };

    me.match = function(spec) {
      if(angular.isString(spec)) { // save resources
        if(spec === '*') {
          return angular.copy(keys);
        }
      }

      spec = matchSpecNormalize(spec);

      return keys.reduce(function (p, c) {
        var matches = !spec.every(function (expr) {
          return !expr.test(c);
        });

        if(matches) {
          p.push(c);
        }

        return p;
      }, [])
    };

    me.unDot = function (asObject) {
      return keys.map(function (str) {

        var lIndex, orig = str;
        while((lIndex = str.indexOf('.')) > -1) {
          str = str.substring(0, lIndex) + (!!str[lIndex + 1]
            ? (str[lIndex+1].toUpperCase() + str.substring(lIndex + 2, str.length))
            : '');
        }

        return asObject ? {original: orig, undotted: str} : str;
      });
    };
  };
})
.factory('AclResourceRules', function ($log, AclStatics, AclRole) {
  return function AclResourceRules() {
    var
    me = this,
    chain = [];

    function rule(allow, role, spec) {

      var
      tmpRule = {
        allow: !!allow,
        spec: spec
      };

      if(!!role) {
        tmpRule.role = AclRole.toString(role);
      }

      return tmpRule;
    }

    function definer(isAllow) {
      return function (role, spec) {

        if(arguments.length === 1) {
          spec = role;
          role = undefined;
        }

        if(angular.isArray(role)) { // multiple roles
          role.forEach(function (r) {
            chain.push(rule(isAllow, r, spec));
          });
        }
        else { // single role
          chain.push(rule(isAllow, role, spec));
        }

        return me;
      }
    }

    // :D
    me.allow = definer(true);
    me.deny = definer(false);

    me.applyTo = function(collection, roles) {

      function applyRule(storage, allow, role, resources) {
        storage = storage || {};
        resources = resources || [];

        var roleName = AclRole.toString(role);

        if(!roleName) {
          throw new Error('Role name is invalid: '+ String(roleName));
        }

        if( ! storage.hasOwnProperty(roleName) ) { // seed mash up buffer
          storage[roleName] = {
            role: AclRole.wrap(roleName, roles), // wrap with original role in community of roles (so we get the same instance].
            resources: []
          };
        }

        if(allow) { // add unique resources matched
          storage[roleName].resources = storage[roleName].resources
            .concat(resources.filter(function (v) {
              return storage[roleName].resources.indexOf(v) === -1;
            }));
        }
        else { // remove matching resources
          storage[roleName].resources = storage[roleName].resources
            .filter(function (v) {
              return resources.indexOf(v) === -1;
            });
        }
      }

      var
      // assemble map of roles and resources, indexed by role name.
      resourceRole = chain
        .map(function (entry) { //
          return [entry.role || false, entry.allow, collection.match(entry.spec)];
        })
        .reduce(function (p, c) { // mash up all {role: resources}
          var
          role      = c[0], // always make sure this is a string
          allow     = c[1],
          resources = c[2];

          if(!role) { // apply to all roles:
            roles.forEach(function (r) {
              applyRule(p, allow, r, resources);
            });

            return p; // skip below
          }

          applyRule(p, allow, role, resources);
          return p;
        }, {});

      return Object.keys(resourceRole)
        .map(function (roleName) { // work out delegration and finalize our resource list
          var
          item      = resourceRole[roleName],
          role      = item.role,
          roleName  = role.getName(),
          resources = item.resources;

          if(role.hasDelegates()) {

            role.getDelagates().forEach(function (delagate) {
              var
              delagateResources = resourceRole[delagate.getName()].resources;

              if(!delagateResources) {
                return;
              }

              resources = resources // append the delegate's resources we don't already have:
                .concat(delagateResources.filter(function (dresource) {
                  return resources.indexOf(dresource) === -1;
                }));
            });
          }

          return resources.map(function (resource) {
            return AclStatics.roleResourceKey(roleName, resource);
          });
        })
        .reduce(function (p, c) { // unzip parent array which is grouped by role!
          return p.concat(c);
        }, []);
    };
  };
})
.factory('AclModule', function ($log, $resource, $merge, AclStatics, AclResourceCollection, AclResourceRules, AclRole) {

  return function AclModule (roles, resources) {
    var
    me = this,
    community,
    collection,
    rules,
    optimized;

    var
    deferOptimized = function(fn, scope) {
      fn = fn || angular.noop;
      scope = scope || me;

      return function() {
        if(!optimized) {
          throw new Error('This ACL module has not been marked as finished yet.');
        }

        return fn.apply(scope, arguments);
      };
    };
    me.findRoleResource = deferOptimized(function (role, v, match) {
      match = !!(match || false);

      var
      reqTest = AclStatics
        .wrapArray(v)
        .map(function (test) {
          return optimized.indexOf(AclStatics.roleResourceKey(role, test)) > -1;
        });

      return reqTest.indexOf(match);
    });
    me.testAll = deferOptimized(function (role, v) {
      return me.findRoleResource(role, v, false) === -1;
    });
    me.testAny = deferOptimized(function (role, v) {
      return me.findRoleResource(role, v, true) > -1;
    });
    me.allows = deferOptimized(function (role) {
      role = AclRole.wrap(role);

      return optimized.reduce(function (p, resourceMap) {
        var matches = resourceMap.match(/^([a-z0-9]+)\:(.*)$/i);
        if(matches) {
          var
          tRole = matches[1],
          tResource = matches[2];

          if(role.equals(tRole)) {
            p.push(tResource);
          }
        }

        return p;
      },[]);
    });

    me.loadRoles = function(v) {
      return AclStatics
        .wrapArray(v)
        .map(me.loadRole);
    };
    me.loadRole = function(v) {
      return AclRole.wrap(v, community);
    };
    me.loadResource = function(v) {
      return collection.define(v);
    };
    me.loadResources = function(v) {
      return AclStatics
        .wrapArray(v)
        .map(me.loadResource)
    };
    me.getRules = function () {
      return rules;
    };
    me.getRoles = function () {
      return community;
    };
    me.getResourceCollection = function () {
      return collection;
    };
    me.clear = function(v) {
      community = [];
      collection = new AclResourceCollection();
      rules = new AclResourceRules();

      // create convienence method
      me.allow = rules.allow.bind(me);
      me.deny = rules.deny.bind(me);
      return me;
    };
    me.defer = function(requireResources, cb, scope) {
      return function (role /* , ... */) {
        var
        args = AclStatics.argsToArray(arguments);

        if(args.length === 0) {
          throw new Error('This ACL module function requires an arguments for role.');
        }

        var
        role = args.shift();

        if(!role) {
          throw new Error('Invalid role supplied to ACL module function.');
        }

        if(me.testAll(role, requireResources)) { // call original function (all requirements must pass)
          return cb.apply(scope, args);
        }
        else { // block this call
          throw new Error('Role does not have access to this resource.');
        }
      };
    };

    me.finalize = function() {
      optimized = rules.applyTo(collection, community);
      return me;
    };

    me.buildService = function(endpoint, paramDefaults, methodMap) {

      me.finalize();

      methodMap = methodMap || {};

      var
      spec = {},
      undotted = collection.unDot(true),
      resource,
      deferPromised = function(cb, scope) {
        return function() {
          return cb.apply(scope||this, arguments).$promise;
        };
      };

      // assemble virtual methods for $resource
      undotted.forEach(function (undot) {

        var
        method = 'GET',
        params = {
          resource: undot.original
        },
        specEntry = {
          method: method,
          params: params
        };

        if(!!methodMap[undot.undotted]) {
          specEntry = $merge(specEntry, methodMap[undot.undotted]);
        }

        spec[undot.undotted] = specEntry;
      });

      var nonAclMethods = [];

      Object.keys(methodMap).forEach(function (method) { // add any missing entries
        if(!spec[method]) {
          spec[method] = methodMap[method];
          nonAclMethods.push(method);
        }
      });

      resource = $resource(endpoint, paramDefaults, spec);

      undotted // defer resource requests made by this ACL to our defer function (requires role param)
        .forEach(function (undot) { // override resource's method with our deferred method
          var originalFn = resource[undot.undotted];
          resource[undot.undotted] = me.defer(undot.original, deferPromised(originalFn), resource);
        });

      nonAclMethods
        .forEach(function (method) {
          var originalFn = resource[method];
          resource[method] = deferPromised(originalFn, resource);
        });

      return resource;
    };

    me.clear(); // clear on start

    if(!!roles) {
      me.loadRoles(roles);
    }

    if(!!resources) {
      me.loadResources(resources);
    }
  };
})
.service('$acl', function (AclModule) {
  var
  registry = {};

  return {
    has: function(module) {
      return registry[module] !== undefined;
    },
    register: function(module, roles, resources) {
      if(this.has(module)) {
        throw new Error('This module has already been registered in $acl.');
      }
      return registry[module] = new AclModule(roles, resources);
    },
    recall: function(module) {
      if(!this.has(module)) {
        throw new Error('This module has not been registered in $acl.');
      }
      return registry[module];
    }
  };
});