let serverURL = '//cdnetworks-paris.red5.org';
let server = document.getElementById('server');
let size = document.getElementById('size');
let quality = document.getElementById('quality');
let timer = document.getElementById("timer");
let delay = document.getElementById("delay");
let error = document.getElementById("error");
let main = document.getElementById("main");
let errorResolution = "Your`s webCam doesn`t supports this resolution. Please, choose resolution lower.";
let vids = document.getElementsByTagName('video');

let sizes = [
    {width: 320, height: 240, className: 'smallest'},
    {width: 640, height: 480, className: 'small'},
    {width: 1280, height: 720, className: 'medium'},
    {width: 1920, height: 1080, className: 'large'}
];
let currentSize = {width: 640, height: 480};
let currentQuality = 512;
let currentVideoClass = 'small';

let options = {
    class: 'iFrameClass',
    endpoint: 'http://app.singular.live',
    interactive: true,
    syncGraphics: false,
    showPreloader: false,
    aspect: ''
};
let overlay;

window.onload = () => {
    initStream = (serverURL) => {
        hideError();
        let streamName = 'red5proLatency' + Math.round(1 - 0.5 + Math.random() * (10000 - 1 + 1));
        ((red5prosdk) => {

            let publisher = new red5prosdk.RTCPublisher();
            let subscriber = new red5prosdk.RTCSubscriber();

            publisher.init({
                host: serverURL,
                protocol: 'wss',
                port: 443,
                iceServers: [{urls: 'stun:stun2.l.google.com:19302'}],
                app: 'live',
                streamName: streamName,
                mediaElementId: 'publisher',
                bandwidth: {
                    audio: 56,
                    video: currentQuality
                },
                mediaConstraints: {
                    audio: true,
                    video: {
                        width: currentSize.width
                        ,
                        height: currentSize.height
                        ,
                        frameRate: {
                            min: 8,
                            max: 24
                        }
                    }
                }
            }).then((rtcPublisherReference) => {
                navigator.mediaDevices.getUserMedia({
                    video: {width: {min: currentSize.width}, height: {min: currentSize.height}}
                }).then((stream) => {
                    publisher.srcObject = stream;
                    rtcPublisherReference.on('*', event => {
                        console.groupCollapsed(`[rtcPublisher] ${event.type}`);
                        console.log(event);
                        console.groupEnd();
                    });
                    console.log('publish');
                    setMainBlockStyles();
                    return publish();
                }).catch((error) => {
                    console.log('getUserMedia error!', error);
                    showError(errorResolution);
                });

            })
                .catch(function (error) {
                    console.error(error);
                });

            window.publish = () => {
                publisher.publish();
                publisher.on('Publish.Start', handlePublisherEvent);
            };

            window.unpublish = () => {
                publisher.unpublish().then(() => {
                    console.log('unpublished');
                });
            };

            window.unsubscribe = () => {
                subscriber.unsubscribe().then(() => {
                    console.log('Unsubscribed');
                });
            };

            window.handlePublisherEvent = () => {
                subscriber.init({
                    host: serverURL,
                    protocol: 'wss',
                    port: 443,
                    iceServers: [{urls: 'stun:stun2.l.google.com:19302'}],
                    app: 'live',
                    streamName: streamName,
                    mediaElementId: 'subscriber',
                    subscriptionId: streamName
                })
                    .then((subscriber) => {
                        console.log('Subscribe');
                        return subscriber.subscribe();
                    })
                    .then((subscriber) => {
                        console.log('Subscribed');
                        removeSize();
                        setSize(currentVideoClass);
                        // initSingular();
                        // setSingular('0gLC3KNfPudPCd04dNl4DQ');
                    })
                    .catch(function (error) {
                        console.error(error);
                    });
            };

        })(window.red5prosdk);
    };
    initStream(serverURL);
    // initStreams();
};

window.addEventListener('beforeunload', (event) => {
    event.returnValue = clearSub();
});

// async function initStreams() {
//     await initStream('//cdnetworks-paris.red5.org', 'publisher', 'subscriber');
//     await initStream('//cdnetworks-la.red5.org', 'publisher2', 'subscriber2');
// }

async function clearSub() {
    // overlay.hide();

    await window.unsubscribe();
    await window.unpublish();
}

setMainBlockStyles = () => {
    if(currentSize.width>=1280) {
        main.classList.remove("large");
        main.classList.add("large");
    } else {
        main.classList.remove("large");
    }
};

setSize = (sizeClass) => {
    vids[0].classList.add(sizeClass);
    vids[1].classList.add(sizeClass);
};

removeSize = () => {
    for (let i = 0; i < sizes.length; i++) {
        console.log(sizes[i].className);
        if (vids[0].classList.contains(sizes[i].className)) {
            vids[0].classList.remove(sizes[i].className);
        }
    }
};

showError = (errorText) => {
    error.classList.add("active");
    error.innerHTML = errorText;
};

hideError = () => {
    error.innerHTML = "";
    error.classList.remove("active");
};

initSingular = () => {
    overlay = SingularOverlay('#SingularOverlay', options, (params) => {
        console.log("Singular Overlay Init - Success");
    });
};

setSingular = (compToken) => {
    overlay.setContent({
        compToken: compToken
    }, (params) => {
        // called when content finished loading
        // console.log('delay', params);
        // overlay.setDelay(5500);

        console.log("Singular Overlay Content Loaded - Success");
    });
    // overlay.setDelay(5500);
    overlay.videoSegment(4000); //looks like max delay 4000
};

chooseServer = () => {
    clearSub().then(() => {
        let index = server.selectedIndex;
        let options = server.options;
        serverURL = options[index].value;
        initStream(serverURL);
        console.log('server URL:', serverURL);
    });
};

chooseVideoSize = () => {
    clearSub().then(() => {
        let index = size.selectedIndex;
        let options = size.options;
        let width = options[index].value;
        currentSize = defineSize(width);
        currentVideoClass = defineSize(width).className;
        initStream(serverURL);
        console.log('current Size:', currentSize);
    });
};

defineSize = (width) => {
    switch (width) {
        case '320':
            return sizes[0];
            break;
        case '640':
            return sizes[1];
            break;
        case '1280':
            return sizes[2];
            break;
        case '1920':
            return sizes[3];
            break;
        default:
            alert('Я таких значений не знаю');
    }
};

chooseQuality = () => {
    clearSub().then(() => {
        let index = quality.selectedIndex;
        let options = quality.options;
        currentQuality = options[index].value;
        initStream(serverURL);
        console.log('current Quality:', currentQuality);
    });
};