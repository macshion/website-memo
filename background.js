chrome.action.onClicked.addListener( async ( tab ) => {
    try {
        await chrome.sidePanel.open( { windowId: tab.windowId } );

        await chrome.sidePanel.setOptions( {
            enabled: true,
            path: 'sidebar/sidebar.html'
        } );
    } catch ( error ) {
        console.error( '打开侧边栏时出错:', error );
    }
} );

chrome.runtime.onInstalled.addListener( async () => {
    try {
        await chrome.sidePanel.setOptions( {
            enabled: true,
            path: 'sidebar/sidebar.html'
        } );
    } catch ( error ) {
        console.error( '设置侧边栏选项时出错:', error );
    }
} ); 