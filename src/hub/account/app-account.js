import { AppExt } from 'modapp';
import initModules from './modules/init-modules';
import moduleConfig from 'moduleConfig';
import 'scss/index.scss';

// Create app and load core modules
let app = new AppExt(moduleConfig);
app.loadBundle(initModules).then(result => {
	console.log("Init modules: ", result);
	app.render(document.body);

	// Load main modules
	import(/* webpackChunkName: "account-main" */ './modules/main-modules').then(({ default: mainModules }) => {
		app.loadBundle(mainModules).then(result => {
			console.log("Main modules: ", result);
		});
	});
});

// Make app global
window.app = app;
