// This will use the demo backend if you open index.html locally via file://, otherwise your server will be used
let backendUrl = location.protocol === 'file:' ? "https://tiktok-chat-reader.zerody.one/" : undefined;
let connection = new TikTokIOConnection(backendUrl);

// Counter
let viewerCount = 0;
let likeCount = 0;
let diamondsCount = 0;

var teamOneScore = 0;
var teamTwoScore = 0;

// These settings are defined by obs.html
if (!window.settings) window.settings = {};

$(document).ready(() => {
    $('#connectButton').click(connect);
    $('#uniqueIdInput').on('keyup', function (e) {
        if (e.key === 'Enter') {
            connect();
        }
    });

    if (window.settings.username) connect();
})

function connect() {
    let uniqueId = window.settings.username || $('#uniqueIdInput').val();
    if (uniqueId !== '') {

        $('#stateText').text('Connecting...');

        connection.connect(uniqueId, {
            enableExtendedGiftInfo: true
        }).then(state => {
            $('#stateText').text(`Connected to roomId ${state.roomId}`);

            // reset stats
            viewerCount = 0;
            likeCount = 0;
            diamondsCount = 0;
            updateRoomStats();
            var conInterface = document.getElementById("connectionInterface");
            conInterface.style.display = "none";
            var roomStateTblRow = document.getElementById("roomStateTblRow");
            roomStateTblRow.style.display = "none";

        }).catch(errorMessage => {
            $('#stateText').text(errorMessage);

            // schedule next try if obs username set
            if (window.settings.username) {
                setTimeout(() => {
                    connect(window.settings.username);
                }, 30000);
            }
        })

    } else {
        alert('no username entered');
    }
}

// Prevent Cross site scripting (XSS)
function sanitize(text) {
    return text.replace(/</g, '&lt;')
}

function updateRoomStats() {
    $('#roomStats').html(`<center>Viewers: <b style="color: green;">${viewerCount.toLocaleString()}</b> Likes: <b style="color: red;">${likeCount.toLocaleString()}</b></center`)
}

function generateUsernameLink(data) {
    return `<a class="usernamelink" href="https://www.tiktok.com/@${data.uniqueId}" target="_blank">${data.uniqueId}</a>`;
}

function isPendingStreak(data) {
    return data.giftType === 1 && !data.repeatEnd;
}

/**
 * Add a new message to the chat container
 */
function addChatItem(color, data, text, summarize) {
    let container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.chatcontainer');

    if (container.find('div').length > 500) {
        container.find('div').slice(0, 200).remove();
    }

    container.find('.temporary').remove();;

    container.append(`
        <div class=${summarize ? 'temporary' : 'static'}>
            <img class="miniprofilepicture" src="${data.profilePictureUrl}">
            <span>
                <b>${generateUsernameLink(data)}:</b> 
                <span style="color:${color}">${sanitize(text)}</span>
            </span>
        </div>
    `);

    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 400);
}

function countDiamonds(data) {
    if (data.giftType === 1 && !data.repeatEnd) {
        // Streak in progress => show only temporary
        return 0;
    } else {
        // Streak ended or non-streakable gift => process the gift with final repeat_count
        return (data.repeatCount * data.diamondCount);
    }
}

/**
 * Add a new gift to the gift container
 */
function addGiftItem(data) {
    let giftStreakId = data.userId.toString() + '_' + data.giftId;

    switch (data.giftId) {
    case 5655:
    case 5650:
    case 6070:
    case 5585:
    case 7121:
    case 8066:
    case 5734:
    case 6532:
    case 5587:
    case 6033:
    case 7468:
    case 7400:
        teamOneScore += countDiamonds(data);
        break;

    case 5827:
    case 5487:
    case 5879:
    case 5660:
    case 5509:
    case 6007:
    case 6781:
    case 6862:
    case 5475:
    case 7319:
        teamTwoScore += countDiamonds(data);
    break;
    default:
    console.log('Unknown Id');
}

let gameDataContainer = $('.game');
let currentGameData = gameDataContainer.find(`[item_custom_type='gamedata']`);
let gameDataHtml = `<div item_custom_type="gamedata">
                        Team One: ${teamOneScore}</br>
                        Team Two: ${teamTwoScore}</br>
                    </div>`
currentGameData.replaceWith(gameDataHtml);

var firstScoreElement = document.getElementById("teamOneScorePara");
var secondScoreElement = document.getElementById("teamTwoScorePara");

if(teamOneScore > teamTwoScore) {
    firstScoreElement.innerHTML = `<center style="color: red;"><img id="teamOneMedal" src="first.jpg" width="100" height="100">${teamOneScore}</center>`;
    secondScoreElement.innerHTML = `<center><img hidden id="teamOneMedal" src="first.jpg" width="100" height="100">${teamTwoScore}</center>`;
} else if(teamOneScore < teamTwoScore) {
    firstScoreElement.innerHTML = `<center><img hidden id="teamOneMedal" src="first.jpg" width="100" height="100">${teamOneScore}</center>`;
    secondScoreElement.innerHTML = `<center style="color: red;"><img id="teamOneMedal" src="first.jpg" width="100" height="100">${teamTwoScore}</center>`;
} else {
    firstScoreElement.innerHTML = `<center><img hidden id="teamOneMedal" src="first.jpg" width="100" height="100">${teamOneScore}</center>`;
    secondScoreElement.innerHTML = `<center><img hidden id="teamOneMedal" src="first.jpg" width="100" height="100">${teamTwoScore}</center>`;
}

    let container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.giftcontainer');

    if (container.find('div').length > 200) {
        container.find('div').slice(0, 100).remove();
    }

    let streakId = data.userId.toString() + '_' + data.giftId;

    let html = `
        <div data-streakid=${isPendingStreak(data) ? streakId : ''}>
            <img class="miniprofilepicture" src="${data.profilePictureUrl}">
            <span>
                <b>${generateUsernameLink(data)}:</b> <span>${data.describe}</span><br>
                <div>
                    <table>
                        <tr>
                            <td><img class="gifticon" src="${data.giftPictureUrl}"></td>
                            <td>
                                <span>Name: <b>${data.giftName}</b> (ID:${data.giftId})<span><br>
                                <span>Repeat: <b style="${isPendingStreak(data) ? 'color:red' : ''}">x${data.repeatCount.toLocaleString()}</b><span><br>
                                <span>Cost: <b>${(data.diamondCount * data.repeatCount).toLocaleString()} Diamonds</b><span>
                            </td>
                        </tr>
                    </tabl>
                </div>
            </span>
        </div>
    `;

    let existingStreakItem = container.find(`[data-streakid='${streakId}']`);

    if (existingStreakItem.length) {
        existingStreakItem.replaceWith(html);
    } else {
        container.append(html);
    }

    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 800);
}


// viewer stats
connection.on('roomUser', (msg) => {
    if (typeof msg.viewerCount === 'number') {
        viewerCount = msg.viewerCount;
        updateRoomStats();
    }
})

// like stats
connection.on('like', (msg) => {
    if (typeof msg.totalLikeCount === 'number') {
        likeCount = msg.totalLikeCount;
        updateRoomStats();
    }

    if (window.settings.showLikes === "0") return;

    if (typeof msg.likeCount === 'number') {
        addChatItem('#447dd4', msg, msg.label.replace('{0:user}', '').replace('likes', `${msg.likeCount} likes`))
    }
})

// Member join
let joinMsgDelay = 0;
connection.on('member', (msg) => {
    if (window.settings.showJoins === "0") return;

    let addDelay = 250;
    if (joinMsgDelay > 500) addDelay = 100;
    if (joinMsgDelay > 1000) addDelay = 0;

    joinMsgDelay += addDelay;

    setTimeout(() => {
        joinMsgDelay -= addDelay;
        addChatItem('#21b2c2', msg, 'joined', true);
    }, joinMsgDelay);
})

// New chat comment received
connection.on('chat', (msg) => {
    if (window.settings.showChats === "0") return;

    addChatItem('', msg, msg.comment);
})

// New gift received
connection.on('gift', (data) => {
    if (!isPendingStreak(data) && data.diamondCount > 0) {
        diamondsCount += (data.diamondCount * data.repeatCount);
        updateRoomStats();
    }

    if (window.settings.showGifts === "0") return;

    addGiftItem(data);
})

// share, follow
connection.on('social', (data) => {
    if (window.settings.showFollows === "0") return;

    let color = data.displayType.includes('follow') ? '#ff005e' : '#2fb816';
    addChatItem(color, data, data.label.replace('{0:user}', ''));
})

connection.on('streamEnd', () => {
    $('#stateText').text('Stream ended.');

    // schedule next try if obs username set
    if (window.settings.username) {
        setTimeout(() => {
            connect(window.settings.username);
        }, 30000);
    }
})