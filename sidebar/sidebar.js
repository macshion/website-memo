class NotesManager {
    constructor () {
        this.initElements();
        this.bindEvents();
        this.loadNotes();
    }

    initElements () {
        this.textarea = document.getElementById( 'newNoteText' );
        this.saveButton = document.getElementById( 'saveNote' );
        this.exportButton = document.getElementById( 'exportBtn' );
        this.notesList = document.getElementById( 'notesList' );
    }

    bindEvents () {
        this.saveButton.addEventListener( 'click', () => this.saveNote() );
        this.exportButton.addEventListener( 'click', () => this.exportNotes() );

        this.notesList.addEventListener( 'click', async ( e ) => {
            const noteItem = e.target.closest( '.note-item' );
            if ( !noteItem ) return;

            const index = parseInt( noteItem.dataset.index );

            if ( e.target.closest( '.pin-button' ) ) {
                this.togglePin( index );
            } else if ( e.target.closest( '.delete-button' ) ) {
                this.deleteNote( index );
            }
        } );
    }

    async getCurrentTab () {
        const [ tab ] = await chrome.tabs.query( { active: true, currentWindow: true } );
        return tab;
    }

    async saveNote () {
        const content = this.textarea.value.trim();
        if ( !content ) return;

        const tab = await this.getCurrentTab();
        const note = {
            content,
            url: tab.url,
            title: tab.title,
            date: new Date().toISOString(),
            isPinned: false
        };

        const { notes = [] } = await chrome.storage.local.get( 'notes' );
        notes.unshift( note );
        await chrome.storage.local.set( { notes } );

        this.textarea.value = '';
        this.loadNotes();
    }

    async loadNotes () {
        const { notes = [] } = await chrome.storage.local.get( 'notes' );
        const sortedNotes = notes.sort( ( a, b ) => {
            if ( a.isPinned && !b.isPinned ) return -1;
            if ( !a.isPinned && b.isPinned ) return 1;
            return new Date( b.date ) - new Date( a.date );
        } );
        this.notesList.innerHTML = sortedNotes.map( ( note, index ) => this.createNoteHTML( note, index ) ).join( '' );
    }

    createNoteHTML ( note, index ) {
        const date = new Date( note.date ).toLocaleString( 'zh-CN' );
        const pinIconClass = note.isPinned ? 'pinned' : '';
        return `
            <div class="note-item" data-index="${ index }">
                <div class="note-header">
                    <div class="note-actions">
                        <button class="pin-button ${ pinIconClass }" title="${ note.isPinned ? '取消置顶' : '置顶' }">
                            <svg width="16" height="16" viewBox="0 0 24 24">
                                <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" />
                            </svg>
                        </button>
                        <button class="delete-button" title="删除">
                            <svg width="16" height="16" viewBox="0 0 24 24">
                                <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                            </svg>
                        </button>
                    </div>
                    <div class="note-date">${ date }</div>
                </div>
                <div class="note-content">${ this.escapeHTML( note.content ) }</div>
                <a href="${ note.url }" class="note-url" target="_blank" title="${ note.title }">
                    <svg class="link-icon" width="14" height="14" viewBox="0 0 24 24">
                        <path d="M10.59,13.41C11,13.8 11,14.44 10.59,14.83C10.2,15.22 9.56,15.22 9.17,14.83C7.22,12.88 7.22,9.71 9.17,7.76V7.76L12.71,4.22C14.66,2.27 17.83,2.27 19.78,4.22C21.73,6.17 21.73,9.34 19.78,11.29L18.29,12.78C18.3,11.96 18.17,11.14 17.89,10.36L18.36,9.88C19.54,8.71 19.54,6.81 18.36,5.64C17.19,4.46 15.29,4.46 14.12,5.64L10.59,9.17C9.41,10.34 9.41,12.24 10.59,13.41M13.41,9.17C13.8,8.78 14.44,8.78 14.83,9.17C16.78,11.12 16.78,14.29 14.83,16.24V16.24L11.29,19.78C9.34,21.73 6.17,21.73 4.22,19.78C2.27,17.83 2.27,14.66 4.22,12.71L5.71,11.22C5.7,12.04 5.83,12.86 6.11,13.65L5.64,14.12C4.46,15.29 4.46,17.19 5.64,18.36C6.81,19.54 8.71,19.54 9.88,18.36L13.41,14.83C14.59,13.66 14.59,11.76 13.41,10.59C13,10.2 13,9.56 13.41,9.17Z" />
                    </svg>
                    <span>${ note.title || note.url }</span>
                </a>
            </div>
        `;
    }

    escapeHTML ( str ) {
        const div = document.createElement( 'div' );
        div.textContent = str;
        return div.innerHTML;
    }

    async exportNotes () {
        const { notes = [] } = await chrome.storage.local.get( 'notes' );
        const blob = new Blob( [ JSON.stringify( notes, null, 2 ) ], { type: 'application/json' } );
        const url = URL.createObjectURL( blob );

        const a = document.createElement( 'a' );
        a.href = url;
        a.download = `网页笔记_${ new Date().toLocaleDateString() }.json`;
        a.click();

        URL.revokeObjectURL( url );
    }

    async togglePin ( index ) {
        const { notes = [] } = await chrome.storage.local.get( 'notes' );
        notes[ index ].isPinned = !notes[ index ].isPinned;
        await chrome.storage.local.set( { notes } );
        this.loadNotes();
    }

    async deleteNote ( index ) {
        if ( confirm( '确定要删除这条笔记吗？' ) ) {
            const { notes = [] } = await chrome.storage.local.get( 'notes' );
            notes.splice( index, 1 );
            await chrome.storage.local.set( { notes } );
            this.loadNotes();
        }
    }
}

new NotesManager(); 