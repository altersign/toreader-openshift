var NewsListModel = Stapes.subclass({
	constructor: function(app, starred, unread) {
		var news;
		if (starred) {
			news = app.getNewsStarred();
		} else if (unread) {
			news = app.getNewsUnread();
		} else {
			news = app.getNews();
		}
		for (var i in news) {
			var item = news[i];
			this.push(item, true);
		}
		this.emit('change');
	}
});

var NewsItemView = Stapes.subclass({
	constructor: function(app, model) {
		this.app = app;
		this.model = model;
		this.template = document.querySelector('#template-headline').innerHTML;
	},
	render: function() {
		this.model.circleClass = 'circle-empty';
		if (!this.model.is_read) {
			this.model.circleClass = 'circle-full';
		}
		if (this.model.is_saved) {
			this.model.circleClass = 'circle-accented';
		}
		var el = document.createElement("div");
		var s = t(this.template, this.model);
		el.innerHTML = s;
		this.el = el;
		return el;
	},
	renderCircle: function() {
		var circleEl = this.el.querySelector('.bullet');
		if (this.model.is_saved) {
			circleEl.className = "bullet circle-accented";
		} else if (!this.model.is_read) {
			circleEl.className = "bullet circle-full";
		} else {
			circleEl.className = "bullet circle-empty";
		}
	},
	select: function() {
		this.el.className = 'article sel clearfix';
		var top = this.el.offsetTop;
		this.app.markAsRead(this.model.id, true);
		this.model.is_read = 1;
		this.renderCircle();
		window.scrollTo(0, top-screen.height*0.4);
	},
	deselect: function() {
		this.el.className = 'article clearfix';
	}
});

var NewsListView = Stapes.subclass({
	constructor: function(app, view, starred, unread) {
		this.app = app;
		this.root = view;
		this.model = new NewsListModel(app, starred, unread);
		this.model.on('change', this.render.bind(this));
		this.singleNewsItemMode = false;
		this.currentItem = 0;
		this.template = document.querySelector('#template-full').innerHTML;
	},
	render: function() {
		if (this.model.size() == 0) {
			this.root.innerHTML = '<p class="emptylist">No news.</p>';
			return;
		}
		if (this.singleNewsItemMode) {
			this.renderFullText();
		} else {
			this.renderHeadlines();
		}
	},
	renderHeadlines: function() {
		var s = '';
		this.views = [];
		this.root.innerHTML = '';
		this.model.each(function(item) {
			var v = new NewsItemView(this.app, item);
			var el = v.render();
			this.views.push(v);
			this.root.appendChild(el);
		}.bind(this));
		this.currentItem = this.currentItem || 0;
		this.views[this.currentItem].select();
	},
	renderFullText: function() {
		var item = this.model.getAllAsArray()[this.currentItem];
		var s = t(this.template, item);
		this.root.innerHTML = s;
	},
	onHotkey: function(e) {
		if (e.keyCode == 74) {
			// j
			if (!this.singleNewsItemMode) {
				this.views[this.currentItem].deselect();
			}
			this.currentItem++;
			if (this.currentItem >= this.model.size()) {
				this.currentItem = this.model.size() - 1;
			}
			if (!this.singleNewsItemMode) {
				this.views[this.currentItem].select();
			} else {
				this.render();
			}
		} else if (e.keyCode == 75) {
			// k
			if (!this.singleNewsItemMode) {
				this.views[this.currentItem].deselect();
			}
			this.currentItem--;
			if (this.currentItem < 0) {
				this.currentItem = 0;
			}
			if (!this.singleNewsItemMode) {
				this.views[this.currentItem].select();
			} else {
				this.render();
			}
		} else if (e.keyCode == 79) {
			// o
			this.singleNewsItemMode = !this.singleNewsItemMode;
			this.render();
		} else if (e.keyCode == 83) {
			// s
			var m = this.model.getAllAsArray()[this.currentItem];
			this.app.markAsStarred(m.id, !m.is_saved);
			if (!this.singleNewsItemMode) {
				var m = this.views[this.currentItem].model;
				m.is_saved = !m.is_saved;
				this.views[this.currentItem].renderCircle();
			} else {
				this.render();
			}
		} else if (e.keyCode == 77) {
			// m
			var m = this.model.getAllAsArray()[this.currentItem];
			this.app.markAsRead(m.id, !m.is_read);
			if (!this.singleNewsItemMode) {
				var m = this.views[this.currentItem].model;
				m.is_read= !m.is_read;
				this.views[this.currentItem].renderCircle();
			} else {
				this.render();
			}
		} else if (e.keyCode == 32) {
			// space
			if (this.singleNewsItemMode) {
				window.scrollBy(0, 40);
			}
		} else if (e.keyCode == 191) {
			// ?
			var el = document.querySelector('.help');
			el.style.display = 'block';
			el.onclick = function() {
				el.style.display = 'none';
			}
		} else if (e.keyCode == 27) {
			// Esc
			var el = document.querySelector('.help');
			if (el.style.display == 'block') {
				el.style.display = 'none';
			}
		} else if (e.keyCode == 82) {
			// r
			location.reload();
		} else if (e.keyCode == 86) {
			// v
			var m = this.model.getAllAsArray()[this.currentItem];
			this.app.openTab(m.url);
		} else if (e.keyCode == 65 && e.shiftKey) {
			var news = this.app.getNews();
			for (var i in news) {
				if (!news[i].is_read) {
					this.app.markAsRead(news[i].id, true);
				}
			}
			this.model.each(function(item) {
				item.is_read = 1;
			});
			if (!this.singleNewsItemMode) {
				for (var i = 0; i < this.views.length; i++) {
					this.views[i].renderCircle();
				}
			}
			window.localStorage['news:items'] = JSON.stringify(news);
		} else {
			console.log(e.keyCode);
			return;
		}
		event.preventDefault();
	}
});

var LoginView = Stapes.subclass({
	constructor: function(app, view) {
		this.app = app;
		this.rootView = view;
		this.template = document.querySelector('#template-login').innerHTML;
	},
	bindUiEvents: function() {
		var tryLogin = function() {
			var host = this.rootView.querySelector('input.hostname').value;
			var login = this.rootView.querySelector('input.login').value;
			var passwd = this.rootView.querySelector('input.password').value;
			console.log(host, login, passwd);
			this.app.HOST = host;
			this.app.LOGIN = login;
			window.localStorage['config:host'] = host;
			window.localStorage['config:login'] = login;
			this.login(passwd);
		}.bind(this);
		this.loginButton.addEventListener('click', tryLogin, false);
		this.textInput.addEventListener('keypress', function(event) {
			if (event.charCode == 13) {
				tryLogin();
			}
		}, false);
	},
	render: function() {
		var s = t(this.template);
		this.rootView.innerHTML = s;
		this.loginButton= this.rootView.querySelector('.btn-login');
		this.textInput = this.rootView.querySelector('input.password');
		this.bindUiEvents();
	},
	login: function(passwd) {
		var auth = md5(this.app.LOGIN + ':' + passwd);
		this.app.feverApi(this.app.HOST, auth, '', function(s) {
			if (!s) {
				this.loginFailed();
				return;
			}
			this.loginSuccess(auth);
		}.bind(this));
	},
	loginFailed: function() {
		this.rootView.querySelector('.errormsg').innerText = 'Sorry, login failed.';
		this.app.doLogout();
	},
	loginSuccess: function(auth) {
		this.rootView.querySelector('.errormsg').innerText = '';
		this.app.setAuthToken(auth);
		window.location.hash = '#news';
		this.app.sync();
	}
});

var SettingsView = Stapes.subclass({
	constructor: function(app, view) {
		this.app = app;
		this.rootView = view;
		this.template = document.querySelector('#template-settings').innerHTML;
	},
	render: function() {
		this.rootView.innerHTML = t(this.template, {});
		var logoutButton = this.rootView.querySelector('.btn-logout');
		logoutButton.addEventListener('click', function(event) {
			this.app.doLogout();
			return false;
		}.bind(this), false);
	}
});

var App = Stapes.subclass({
	//LOGIN: 'stringer',
	//HOST: 'vast-badlands-1422.herokuapp.com',
	//HOST: '192.168.0.107:5000',
	MAX_CACHED: 50,
	root: '.container',
	routes: {
		"login": function() { this.doLogin(); },
		"news": function() { this.doNews('all'); },
		"starred": function() { this.doNews('starred'); },
		"unread": function() { this.doNews('unread'); },
		"feeds": function() {
			console.log('FEEDS');
		},
		"settings": function() { this.doSettings(); },
		"help": function() { this.doHelp(); }
	},
	constructor: function() {
		if (location.protocol == 'chrome-extension:') {
		} else {
			// browser version is always authorized at present
			window.localStorage['config:host'] = window.location.host;
			window.localStorage['config:login'] = 'toreader';
			var auth = md5('toreader:toreader');
			this.setAuthToken(auth);
		}
		this.HOST = window.localStorage['config:host'];
		this.LOGIN = window.localStorage['config:login'];
		this.rootView = document.querySelector('.container');
		window.localStorage['news:items'] = window.localStorage['news:items'] || '[]';
		window.addEventListener('hashchange', this.hashchange.bind(this), false);
		this._routes = [];
		for (var route in this.routes) {
			var fn = this.routes[route];
			this._routes.push({
				pattern: new RegExp('^#'+route.replace(/:\w+/, '(\\w+)')+'$'),
				callback: fn.bind(this)
			});
		}
		window.onkeydown = function(event) {
			if (this.currentView != null && this.currentView.onHotkey) {
				this.currentView.onHotkey(event);
				return true;
			}
		}.bind(this);
		if (this.getAuthToken()) {
			this.sync();
		}
		this.hashchange();
	},
	hashchange: function() {
		if (window.location.hash !== '#login') {
			if (!this.getAuthToken()) {
				window.location.hash = '#login';
				return;
			}
		}

		var path = window.location.hash;
		for (var i = this._routes.length - 1; i >= 0; i--) {
			var args = path.match(this._routes[i].pattern);
			if (args) {
				this._routes[i].callback.apply(this, args.slice(1));
				return;
			}
		}
		// default route
		window.location.hash = '#news';
	},
	doLogin: function() {
		var loginView = new LoginView(this, this.rootView);
		loginView.render();
		this.currentView = loginView;
	},
	doLogout: function() {
		window.localStorage['news:items'] = '[]';
		window.localStorage.removeItem('config:host');
		window.localStorage.removeItem('config:login');
		this.setAuthToken(null);
		window.location.hash = '#login';
	},
	doSettings: function() {
		var settingsView = new SettingsView(this, this.rootView);
		settingsView.render();
		this.currentView = settingsView;
	},
	doNews: function(route) {
		var starred = (route === 'starred');
		var unread = (route === 'unread');
		var newsListView = new NewsListView(this, this.rootView, starred, unread);
		newsListView.render();
		this.currentView = newsListView;
	},
	doHelp: function() {
		var el = document.querySelector('.help');
		el.style.display = 'block';
		el.onclick = function() {
			el.style.display = 'none';
		}
	},
	feverApi: function fever(host, auth, args, cb) {
		var req = new XMLHttpRequest();
		var url = 'http://' + host + '/fever?api' + args;
		console.log('URL: ', url);
		req.open('POST', url, true);
		req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		req.onreadystatechange = function() {
			if (req.readyState == 4) {
				if (req.status == 200) {
					var result = JSON.parse(req.responseText);
					if (result) {
						if (result.auth == 0) {
							console.log('request failed: auth == 0', result);
							this.setAuthToken(null);
						} else {
							cb(result);
						}
						return;
					}
				} else if (req.status == 403) {
					this.setAuthToken(null);
				}
				console.log('request failed: ', req);
			}
		}.bind(this);
		req.send('api_key='+auth);
	},
	sync: function() {
		console.log('sync');
		clearTimeout(this.nextSyncTimeoutId);
		var news = this.getNews();
		var max = 0;
		for (var i in news) {
			var item = news[i];
			if (item.id > max) {
				max = item.id;
			}
		}
		this.fetchNews(max+1, 50, function(s) {
			if (s.items.length == 0) {
				this.nextSyncTimeoutId = setTimeout(this.sync.bind(this), 60 * 1000);
				console.log('sync: fetched items');
				this.feverApi(this.HOST, this.getAuthToken(), '&unread_item_ids', function(s) {
					var unread = s.unread_item_ids.split(',');
					console.log('sync: fetched unread', unread);
					for (var i in news) {
						var item = news[i];
						if (unread.indexOf(''+item.id) != -1) {
							item.is_read = 0;
						} else {
							item.is_read = 1;
						}
					}
					this.feverApi(this.HOST, this.getAuthToken(), '&saved_item_ids', function(s) {
						var saved = s.saved_item_ids.split(',');
						console.log('sync: fetched starred', saved);
						for (var i in news) {
							var item = news[i];
							if (saved.indexOf(''+item.id) != -1) {
								item.is_saved = 1;
							} else {
								item.is_saved = 0;
							}
						}
						window.localStorage['news:items'] = JSON.stringify(news);
					}.bind(this));
				}.bind(this));
				return;
			}
			this.updateNews(s.items);
			// update initial message
			if (this.rootView.textContent == 'No news.' || this.rootView.innerText == 'No news.') {
				this.hashchange();
			}
			this.sync();
		}.bind(this));
	},
	fetchNews: function(from, count, cb) {
		var ids = '' + from;
		for (var i = 1; i < count; i++) {
			ids = '' + ids + ',' + (from+i);
		}
		this.feverApi(this.HOST, this.getAuthToken(), '&items&with_ids=' + ids, cb);
	},
	updateNews: function(items) {
		var store = window.localStorage;
		store['news:items'] = store['news:items'] || '[]';
		var news = JSON.parse(store['news:items']);
		var ids = [];
		for (var i = 0; i < news.length; i++) {
			ids.push(news[i].id);
		}
		var shouldNotify = false;
		for (var i in items) {
			var item = items[i];
			if (items[i].id in ids) continue;
			news.push(items[i]);
			shouldNotify = true;
		}
		if (!shouldNotify) {
			return;
		}
		news.sort(function(a, b) {
			if (a.id < b.id) return 1;
			return -1;
		});
		if (news.length > this.MAX_CACHED) {
			news = news.slice(0, this.MAX_CACHED);
		}
		store['news:items'] = JSON.stringify(news);
		this.emit('sync');
	},
	getNews: function() {
		return JSON.parse(window.localStorage['news:items']);
	},
	getNewsUnread: function() {
		var news = this.getNews();
		var res = [];
		for (var i in news) {
			var item = news[i];
			if (item.is_read == 0) {
				res.push(item);
			}
		}
		return res;
	},
	getNewsStarred: function() {
		var news = this.getNews();
		var res = [];
		for (var i in news) {
			var item = news[i];
			if (item.is_saved) {
				res.push(item);
			}
		}
		return res;
	},
	markAsRead: function(id, on) {
		var news = this.getNews();
		on = (on ? 1 : 0);
		for (var i in news) {
			var item = news[i];
			if (item.id == id) {
				if (item.is_read == on) return;
				item.is_read = on;
				this.feverApi(this.HOST, this.getAuthToken() + '&mark=item&as=' + (on ? 'read' : 'unread') + '&id=' + id, '', function(s) {
					console.log('mark as read: ', s);
				}.bind(this));
				window.localStorage['news:items'] = JSON.stringify(news);
				return;
			}
		}
	},
	markAsStarred: function(id, on) {
		var news = this.getNews();
		for (var i in news) {
			var item = news[i];
			if (item.id == id) {
				item.is_saved = (on ? 1 : 0);
				this.feverApi(this.HOST, this.getAuthToken() + '&mark=item&as=' + (on ? 'saved' : 'unsaved') + '&id=' + id, '', function(s) {
					console.log('mark as starred: ', s);
				}.bind(this));
				window.localStorage['news:items'] = JSON.stringify(news);
				return;
			}
		}
	},
	setAuthToken: function(auth) {
		window.localStorage['config:auth'] = JSON.stringify(auth);
	},
	getAuthToken: function() {
		return typeof window.localStorage['config:auth'] != 'undefined' ?
                        JSON.parse(window.localStorage['config:auth']) : '';
	},
	openTab: function(link) {
		var a = document.createElement("a");
		a.href = link;
		var evt = document.createEvent("MouseEvents");
		evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0,
				true, false, false, false, 0, null);
		a.dispatchEvent(evt);
	}
});

// Template tweet-size function
function t(s,d){ for(var p in d) s=s.replace(new RegExp('{{'+p+'}}','g'), d[p]); return s; }

window.onload = function() {
	console.log('loaded');
	var app = new App();
}

