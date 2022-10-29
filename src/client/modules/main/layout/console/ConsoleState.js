import { Model } from 'modapp-resource';

const consoleStateStoragePrefix = 'console.state.';
const historyStorageSuffix = '.history';

class ConsoleState extends Model {

	/**
	 * Creates an instance of ConsoleState.
	 * @param {object} module Module object.
	 * @param {string} ctrlId Controlled character ID.
	 * @param {object} [opt] Optional params.
	 * @param {number} [opt.historySize] History size. Defaults to 64.
	 * @param {module:modapp~EventBus} [opt.eventBus] Event bus.
	 */
	constructor(module, ctrlId, opt) {
		opt = Object.assign({ eventBus: module.self.app.eventBus }, opt);
		super(opt);

		// Store constants
		this._ctrlId = ctrlId;
		this._historySize = opt.historySize || 64;
		// Store data
		this._doc = "";
		this._history = [];
		this._historyIdx = 0;

		this._load();
		this._updateModel(false, true);
	}

	_updateModel(emit, reset) {
		return super._update({
			doc: this._doc,
			historyIdx: this._historyIdx,
			historyLength: this._history.length,
			isEmpty: !this._doc,
			isClean: !(this._doc.trim()),
			isModified: this.isModified(),
		}, emit, reset);
	}


	setDoc(doc) {
		this._doc = doc;
		this._saveDoc();
		this._updateModel(true);
	}

	/**
	 * Tries to store away any modified entry, moving index to end no matter.
	 * @returns {string} Current doc text.
	 */
	storeHistory() {
		this._addHistory();
		return this._getHistory(this._history.length, true);
	}

	/**
	 * Cycles to next history, and storing away any modified entry to history.
	 * @returns {string} Current doc text.
	 */
	nextHistory() {
		return this._getHistory(this._addHistory() ? this._history.length : this._historyIdx + 1, true);
	}

	/**
	 * Cycles to previous history, and storing away any modified entry to
	 * history.
	 * @returns {string} Current doc text.
	 */
	prevHistory() {
		return this._getHistory(this._addHistory() ? this._history.length - 2 : this._historyIdx - 1, true);
	}

	/**
	 * Check if the document is modified in comparison to the history document
	 * at current index. It compares the trimmed version of the document.
	 * @returns {boolean} True if modified, otherwise false.
	 */
	isModified() {
		return (this._history[this._historyIdx] || "") != (this._doc.trim());
	}

	/**
	 * Loads the history at an index and stores away any modifications as a new history entry.
	 * @param {number} idx History index to load.
	 * @returns {string} Loaded doc text.
	 */
	_getHistory(idx) {
		idx = idx || 0;
		let doc = "";
		if (idx < 0) {
			idx = 0;
		}
		if (idx >= this._history.length) {
			idx = this._history.length;
		} else {
			doc = this._history[idx] || "";
		}

		this._doc = doc;
		this._historyIdx = idx;
		this._saveDoc();
		this._updateModel(true);

		return doc;
	}

	_load() {
		if (!localStorage) return;

		try {
			let raw = localStorage.getItem(consoleStateStoragePrefix + this._ctrlId);
			if (raw) {
				let dta = JSON.parse(raw);
				this._doc = dta.doc || '';
				this._historyIdx = dta.historyIdx || 0;
			}
		} catch (ex) {
			console.error(ex);
		}

		try {
			let raw = localStorage.getItem(consoleStateStoragePrefix + this._ctrlId + historyStorageSuffix);
			if (raw) {
				let dta = JSON.parse(raw);
				if (Array.isArray(dta)) {
					this._history = dta;
				}
			}
		} catch (ex) {
			console.error(ex);
		}
	}

	_saveDoc() {
		if (!localStorage) return;

		try {
			localStorage.setItem(consoleStateStoragePrefix + this._ctrlId, JSON.stringify({
				doc: this._doc,
				historyIdx: this._historyIdx
			}));
		} catch (ex) {
			console.error(ex);
		}
	}

	_saveHistory() {
		if (!localStorage) return;

		try {
			localStorage.setItem(consoleStateStoragePrefix + this._ctrlId + historyStorageSuffix, JSON.stringify(this._history));
		} catch (ex) {
			console.error(ex);
		}
	}


	/**
	 * Tries to add current document to history, if it has been modified from
	 * current history entry.
	 * @returns {object} Null if no history was added, otherwise an object { shifted: boolean } if the history was shifted.
	 */
	_addHistory() {
		let historyDoc = this._history[this._historyIdx] || "";
		let trimDoc = this._doc.trim();

		// If we are clean, nothing is added
		if (!trimDoc || historyDoc == trimDoc) return null;

		this._history.push(trimDoc);

		// Delete the last history entry if size if exceeded
		if (this._history.length > this._historySize) {
			this._history.shift();
			this._historyIdx--;
		}

		this._saveHistory();

		return true;
	}
}

export default ConsoleState;
