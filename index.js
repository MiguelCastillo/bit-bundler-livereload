var request = require("request");
var tinylr = require("tiny-lr");
var url = require("url");

var defaults = {
	host: process.env.LR_HOST || "localhost",
	port: process.env.LR_PORT || 35729
};

function livereload(options) {
  options = options || {};

  if (options && options.notify) {
    return notify(options.notify);
  }

  return server(options);
}

function server(options) {
	var settings = buildSettings(options);
	var server;

	return function(bitbundler) {
		var logger = bitbundler.getLogger("livereload");

		return {
			"build-init": function() {
				server = tinylr(settings);
				server.listen(settings.port, settings.host, function(err) {
					if (err) {
						logger.error("Error starting livereload", err);
					}
				});
			},
			"build-success": function(ctx) {
				server.changed({
					body: {
						files: getFiles(ctx)
					}
				});
			}
		};
	}
}

function notify(options) {
	var settings = buildSettings(options);

	return {
		"build-success": function(ctx) {
			request.post({
				url: settings.url + "/changed",
				body: {
					files: getFiles(ctx)
				},
				json: true
			});
		}
	};
}

function buildSettings(options) {
	if (typeof options === "string") {
		options = {
			url: options
		};
	}

	var settings = Object.assign({}, defaults, options);

	if (settings.url) {
		var urlResult = url.parse(settings.url);
		settings.host = urlResult.hostname;
		settings.port = urlResult.port;
	}
	else {
		settings.url = settings.host + ":" + settings.port;
	}

	return settings;
}

function getFiles(ctx) {
	var files = [];

	ctx.visitBundles(function(bundle, dest) {
		if (dest) {
			files.push(dest);
		}
	});

	return files;
}

module.exports = livereload;
module.exports.notify = notify;
