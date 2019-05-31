let serverURL = '//red5pro.trembit.com';
let server = document.getElementById('server');
let size = document.getElementById('size');
let quality = document.getElementById('quality');
let timer = document.getElementById("timer");
let delay = document.getElementById("delay");
let error = document.getElementById("error");
let main = document.getElementById("main");
let city = document.getElementById("publish-place");
let container = document.getElementById("container");
let errorResolution = "Your`s webCam doesn`t supports this resolution. Please, choose resolution lower.";
let errorRecognize = "Looks like your webcam can`t catch time. Maybe some freezing." +
    " Adjust the webcam so that the numbers occupy the entire width of the screen";
let vids = document.getElementsByTagName('video');
let spinner = document.getElementById("spinner");
let delayTime = document.getElementById('delay');

let sizes = [
    {width: 320, height: 240, className: 'smallest'},
    {width: 640, height: 480, className: 'small'},
    {width: 1280, height: 720, className: 'medium'},
    {width: 1920, height: 1080, className: 'large'}
];
let currentSize = {width: 640, height: 480, className: 'small'};
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
        activateSpinner();
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
                        removeVideoSize();
                        setVideoSize(currentVideoClass);
                        removeContainerSize();
                        setContainerSize(currentSize.className);
                        setMainBlockStyles();
                        deactivateSpinner();
                    })
                    .catch(function (error) {
                        console.error(error);
                    });
            };

        })(window.red5prosdk);
    };
    initStream(serverURL);
};

// document.onkeydown = function (event) {
//     if (event.keyCode == 67) { //cC
//         recognizeScreen();
//     }
// };

window.addEventListener('beforeunload', (event) => {
    event.returnValue = clearSub();
});
showDelayTime = () => delayTime.classList.add("active");
hideDelayTime = () => delayTime.classList.remove("active");

setDelayTime = (time) => delayTime.innerText = time;

async function clearSub() {
    await window.unsubscribe();
    await window.unpublish();
}

setMainBlockStyles = () => {
    if (currentSize.width >= 1280) {
        main.classList.remove("large");
        main.classList.add("large");
    } else {
        main.classList.remove("large");
    }
};

setContainerSize = (sizeClass) => {
    container.classList.add(sizeClass);

};

removeContainerSize = () => {
    for (let i = 0; i < sizes.length; i++) {
        if (container.classList.contains(sizes[i].className)) {
            container.classList.remove(sizes[i].className);
        }
    }
};

setVideoSize = (sizeClass) => {
    vids[0].classList.add(sizeClass);
    vids[1].classList.add(sizeClass);
};

removeVideoSize = () => {
    for (let i = 0; i < sizes.length; i++) {
        if (vids[0].classList.contains(sizes[i].className)) {
            vids[0].classList.remove(sizes[i].className);
        }
    }
};

activateSpinner = () => {
    if (!spinner.classList.contains('active')) {
        spinner.classList.add('active');
    }
};

deactivateSpinner = () => {
    spinner.classList.remove('active');
};

showError = (errorText) => {
    error.classList.add("active");
    error.innerHTML = errorText;
};

hideError = () => {
    error.innerHTML = "";
    error.classList.remove("active");
};

chooseServer = () => {
    activateSpinner();
    clearSub().then(() => {
        let index = server.selectedIndex;
        let options = server.options;
        serverURL = options[index].value;
        initStream(serverURL);
        console.log('server URL:', serverURL);
    });
};

chooseVideoSize = () => {
    activateSpinner();
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
    activateSpinner();
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

getCity = (data) => {
    city.innerText = data.city;
};

progressUpdate = (packet) => {
    let status = document.createElement('div');
    status.className = 'status';
    status.appendChild(document.createTextNode(packet.status));
    if (packet.status == 'done') {
        result = packet.data.text;
    }
};

recognizeScreen = () => {
    let publisherScreenshot = document.getElementById("publisher");
    let subscriberScreenshot = document.getElementById("subscriber");
    activateSpinner();
    let startPublishRec = new Date();
    Tesseract.recognize(publisherScreenshot)
        .then(function (data) {
            progressUpdate({status: 'done', data: data});
            publisherScreenshot = result;
            let endPublishRec = new Date();
            let delayPublishScreen = (endPublishRec - startPublishRec)/1000;
            Tesseract.recognize(subscriberScreenshot)
                .then(function (data) {
                    progressUpdate({status: 'done', data: data});
                    subscriberScreenshot = result;
                    calculateDelay(publisherScreenshot, subscriberScreenshot, delayPublishScreen);
                });
        });
};

calculateDelay = (publisherScreenshot, subscriberScreenshot, delayScreen) => {
    console.log('get', delayScreen, publisherScreenshot, subscriberScreenshot);

    let publisherStr = publisherScreenshot.replace(/[',"]/g, ".").replace(/[^\.\d]/g, "");
    let subscriberStr = subscriberScreenshot.replace(/[',"]/g, ".").replace(/[^\.\d]/g, "");

    try {
        let pub = publisherStr.match(/\d+\.\d+/);
        let sub = subscriberStr.match(/\d+\.\d+/);
        let res = (((+pub[0] + delayScreen) - +sub[0]) * 1000).toFixed(0);
        console.log("out", +pub[0], +sub[0], delayScreen, res);
        hideError();

        if (res > 4000 || res < 40 || !res) {
            showError(errorRecognize);
            deactivateSpinner();
        } else {
            setDelayTime(res + ' milliseconds');
            deactivateSpinner();
        }
    } catch (err) {
        console.log(err);
        showError(errorRecognize);
        deactivateSpinner();
    }

};