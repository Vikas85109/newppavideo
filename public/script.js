const socket = io("/");
const chatInputBox = document.getElementById("chat_message");
const all_messages = document.getElementById("all_messages");
const main__chat__window = document.getElementById("main__chat__window");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;


var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "3030",
});

let myVideoStream;

var getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    const myVideoDiv = addStreamDiv();
    addVideoStream(myVideoDiv, stream);

    peer.on("call", (call) => {
      call.answer(stream);
      const video = addStreamDiv();

      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream, call.peer);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });

    document.addEventListener("keydown", (e) => {
      if (e.which === 13 && chatInputBox.value != "") {
        socket.emit("message", chatInputBox.value);
        chatInputBox.value = "";
      }
    });

    socket.on("createMessage", (msg) => {
      console.log(msg);
      let li = document.createElement("li");
      li.innerHTML = msg;
      all_messages.append(li);
      main__chat__window.scrollTop = main__chat__window.scrollHeight;
    });


    socket.on("update-mute-status", ({ muted, userId }) => {
      console.log("Mute status update received:", { muted });
      user = muted.userId
      console.log(muted);
      let userDiv = document.getElementById(user);
      if (userDiv) {
        console.log('find');
        userDiv.innerText = muted.muted;
      }
    });

  });

peer.on("call", function (call) {
  getUserMedia(
    { video: true, audio: true },
    function (stream) {
      call.answer(stream); // Answer the call with an A/V stream.
      const video = addStreamDiv();
      call.on("stream", function (remoteStream) {
        addVideoStream(video, remoteStream, call.peer);
      });
    },
    function (err) {
      console.log("Failed to get local stream", err);
    }
  );
});

peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

// CHAT

const connectToNewUser = (userId, streams) => {
  var call = peer.call(userId, streams);
  console.log(call.peer);
  var video = addStreamDiv();
  call.on("stream", (userVideoStream) => {
    console.log(userVideoStream);
    addVideoStream(video, userVideoStream, call.peer);
  });
};

const addVideoStream = (videoContainer, stream, peerid) => {

  if (!peerid) {
      console.log('not');
      peerid = peer.id; 
  }

  const videoEl = videoContainer.querySelector("video");

  if (!videoEl) {
    console.error("No video element found inside the video container");
    return;
  }

  videoEl.srcObject = stream;
  const streamIdDiv = videoContainer.querySelectorAll(".user_name")[0]; // First div for stream ID
  const muteStatusDiv = videoContainer.querySelectorAll(".user_name")[1]; // Second div for mute status

  // Set the stream ID in the first div
  streamIdDiv.innerText = peerid;


  // Function to update mute status
  // const updateMuteStatus = () => {
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length > 0) {
    muteStatusDiv.innerText = audioTracks[0].enabled ? "Unmute" : "Mute";
    muteStatusDiv.id = peerid;
  } else {
    muteStatusDiv.innerText = "No Audio";
  }
  // };
  videoEl.addEventListener("loadedmetadata", () => {
    videoEl.play();
  });

  videoGrid.append(videoContainer);
  let totalUsers = document.getElementsByTagName("video").length;
  if (totalUsers > 1) {
    for (let index = 0; index < totalUsers; index++) {
      document.getElementsByTagName("video")[index].style.width =
        100 / totalUsers + "%";
    }
  }
};

const screenShare = () => {

  navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
    screenStream = stream;
    let videoTrack = screenStream.getVideoTracks()[0];
    videoTrack.onended = () => {
      stopScreenSharing()
    }
    if (peer) {
      let sender = currentPeer.peerConnection.getSenders().find(function (s) {
        return s.track.kind == videoTrack.kind;
      })
      sender.replaceTrack(myVideoStream)
      //   alert(myVideoStream);
      screenSharing = true
    }
    console.log(screenStream)
  })

}



const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  const myMuteStatusDiv = document.querySelector("#video-grid .videos_data:first-child .user_name:nth-child(3)");
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
    myMuteStatusDiv.innerText = "Muted";
    socket.emit("mute-status-changed", { muted: 'Muted', userId: myMuteStatusDiv.id });
  } else {
    setMuteButton();
    myMuteStatusDiv.innerText = "Unmuted";
    myVideoStream.getAudioTracks()[0].enabled = true;
    socket.emit("mute-status-changed", { muted: 'Unmuted', userId: myMuteStatusDiv.id });
  }
};



const setPlayVideo = () => {
  const html = `<i class="unmute fa fa-pause-circle"></i>
  <span class="unmute">Resume Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const setStopVideo = () => {
  const html = `<i class=" fa fa-video-camera"></i>
  <span class="">Pause Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `<i class="unmute fa fa-microphone-slash"></i>
  <span class="unmute">Unmute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};
const setMuteButton = () => {
  const html = `<i class="fa fa-microphone"></i>
  <span>Mute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};



const addStreamDiv = () => {
  // Create the parent div for the videos
  const videosDataDiv = document.createElement('div');
  videosDataDiv.classList.add('videos_data');

  // Create the video element
  const videoElement = document.createElement('video');
  // Set the video source here, if available
  videosDataDiv.appendChild(videoElement);

  // Create the first user name div
  const userName1Div = document.createElement('div');
  userName1Div.classList.add('user_name');
  userName1Div.textContent = 'Umesh Kumar'; // You can set dynamic user name if needed
  videosDataDiv.appendChild(userName1Div);

  // Create the second user name div for "Mute/Unmute"
  const userName2Div = document.createElement('div');
  userName2Div.classList.add('user_name');
  userName2Div.textContent = 'Mute/Unmute'; // You can make this dynamic as well
  videosDataDiv.appendChild(userName2Div);

  return videosDataDiv;
  // Append the whole structure to the body (or another element in your document)
  //videoGrid.appendChild(videosDataDiv);

}


