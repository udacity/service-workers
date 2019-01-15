// If the WHATWG URL implementation is available via the first-party `url`
// module, in Node 7+, then prefer that. Otherwise, fall back on the `dom-urls`
// implementation, which lacks support for the `searchParams` property.
const URL = require('url').URL || require('dom-urls');

const Blob = require('./models/Blob');
const Body = require('./models/Body');
const Cache = require('./models/Cache');
const CacheStorage = require('./models/CacheStorage');
const Client = require('./models/Client');
const WindowClient = require('./models/WindowClient');
const Clients = require('./models/Clients');
const ExtendableEvent = require('./models/ExtendableEvent');
const FetchEvent = require('./models/FetchEvent');
const Headers = require('./models/Headers');
const Notification = require('./models/Notification');
const NotificationEvent = require('./models/NotificationEvent');
const PushEvent = require('./models/PushEvent');
const PushManager = require('./models/PushManager');
const PushSubscription = require('./models/PushSubscription');
const Request = require('./models/Request');
const Response = require('./models/Response');
const ServiceWorkerRegistration = require('./models/ServiceWorkerRegistration');
const MessageEvent = require('./models/MessageEvent');

const eventHandler = require('./utils/eventHandler');

const defaults = (envOptions) => Object.assign({
  locationUrl: 'https://www.test.com'
}, envOptions);

const makeListenersWithReset = () => {
  const listeners = {};
  Object.defineProperty(listeners, 'reset', {
    enumerable: false,
    value: () => {
      self.listeners = makeListenersWithReset();
    }
  });
  return listeners;
};

class ServiceWorkerGlobalScopeMock {
  constructor(envOptions) {
    const options = defaults(envOptions);
    this.listeners = makeListenersWithReset();
    this.location = new URL(options.locationUrl, options.locationBase);
    this.skipWaiting = () => Promise.resolve();
    this.caches = new CacheStorage();
    this.clients = new Clients();
    this.registration = new ServiceWorkerRegistration();

    // Constructors
    this.Blob = Blob;
    this.Body = Body;
    this.Cache = Cache;
    this.Client = Client;
    this.WindowClient = WindowClient;
    this.Event = ExtendableEvent;
    this.ExtendableEvent = ExtendableEvent;
    this.FetchEvent = FetchEvent;
    this.Headers = Headers;
    this.Notification = Notification;
    this.NotificationEvent = NotificationEvent;
    this.PushEvent = PushEvent;
    this.PushManager = PushManager;
    this.PushSubscription = PushSubscription;
    this.Request = Request;
    this.Response = Response;
    this.ServiceWorkerGlobalScopeMock = ServiceWorkerGlobalScopeMock;
    this.URL = URL;
    this.MessageEvent = MessageEvent;

    // Instance variable to avoid issues with `this`
    this.addEventListener = (name, callback) => {
      if (!this.listeners[name]) {
        this.listeners[name] = [];
      }
      this.listeners[name].push(callback);
    };

    // Instance variable to avoid issues with `this`
    this.trigger = (name, args) => {
      if (this.listeners[name]) {
        return eventHandler(name, args, this.listeners[name]);
      }
      return Promise.resolve();
    };

    // Instance variable to avoid issues with `this`
    this.snapshot = () => {
      return {
        caches: this.caches.snapshot(),
        clients: this.clients.snapshot(),
        notifications: this.registration.snapshot()
      };
    };

    // Allow resetting without rewriting
    this.resetSwEnv = () => {
      this.caches.reset();
      this.clients.reset();
      this.listeners.reset();
    };

    this.self = this;
  }
}

module.exports = function makeServiceWorkerEnv(envOptions) {
  return new ServiceWorkerGlobalScopeMock(envOptions);
};
