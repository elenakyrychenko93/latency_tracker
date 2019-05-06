let milisec;
let result;
let ticInterval;
let screenInterval;
let infoString = document.getElementById("info-string");
let delayTime = document.getElementById('delay-time');
let spinner = document.getElementById("spinner");
let server = document.getElementById('server');
let timer = document.getElementById("timer");
let delay = document.getElementById("delay");
let recognizeError = document.getElementById('recognize_error');
// let anotherError = document.getElementById('another_error');
let serverURL = '//red5pro.trembit.com';

window.onload = () => {
    initStream = (serverURL) => {
        let streamName = 'red5proLatency' + Math.round(1 - 0.5 + Math.random() * (10000 - 1 + 1));

        ((red5prosdk) => {

            let publisher = new red5prosdk.RTCPublisher();
            let subscriber = new red5prosdk.RTCSubscriber();

            publisher.init({
                host: serverURL,
                protocol: 'wss',
                port: 8083,
                iceServers: [{urls: 'stun:stun2.l.google.com:19302'}],
                app: 'live',
                streamName: streamName,
                mediaElementId: 'red5pro-publisher',
                bandwidth: {
                    audio: 56,
                    video: 512
                },
                mediaConstraints: {
                    audio: true,
                    video: {
                        width: {
                            exact: 640
                        },
                        height: {
                            exact: 480
                        },
                        frameRate: {
                            min: 8,
                            max: 24
                        }
                    }
                }
            }).then((rtcPublisherReference) => {
                rtcPublisherReference.on('*', event => {
                    console.groupCollapsed(`[rtcPublisher] ${event.type}`);
                    console.log(event);
                    console.groupEnd();
                });
                console.log('publish');
                return publish();
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
                    stopTimer();
                    stopScreenInterval();
                    console.log('unpublished');
                });
            };

            window.unsubscribe = () => {
                subscriber.unsubscribe().then(() => {
                    console.log('Unsubscribed');
                    hideInfoString();
                });
            };

            window.handlePublisherEvent = () => {
                subscriber.init({
                    host: serverURL,
                    protocol: 'wss',
                    port: 8083,
                    iceServers: [{urls: 'stun:stun2.l.google.com:19302'}],
                    app: 'live',
                    streamName: streamName,
                    mediaElementId: 'red5pro-subscriber',
                    subscriptionId: streamName
                })
                    .then((subscriber) => {
                        console.log('Subscribe');
                        return subscriber.subscribe();
                    })
                    .then((subscriber) => {
                        console.log('Subscribed', subscriber);
                        spinner.classList.remove("active");
                        spinner.classList.remove("center");
                        showTime();
                        makeScreens();
                        showInfoString();
                        showDelayTime();
                    })
                    .catch(function (error) {
                        console.error(error);
                    });
            };
        })(window.red5prosdk);
    };
    initStream(serverURL);

};

window.addEventListener('beforeunload', (event) => {
    event.returnValue = clearSub();
});

async function clearSub() {
    await window.unsubscribe();
    await window.unpublish();
}

showInfoString = () => infoString.classList.add("active");
hideInfoString = () => infoString.classList.remove("active");

showDelayTime = () => delayTime.classList.add("active");
hideDelayTime = () => delayTime.classList.remove("active");

showError = (errorType) => errorType.classList.add("active");
hideError = (errorType) => errorType.classList.remove("active");

showTime = () => {
    let startTime = Date.now();
    ticInterval = setInterval(function () {
        let elapsedTime = Date.now() - startTime;
        if (elapsedTime > 99999) {
            startTime = Date.now();
        }
        timer.innerHTML = (elapsedTime / 1000).toFixed(2);
    }, 10)
};

stopTimer = () => {
    clearInterval(ticInterval);
    milisec = 0;
    timer.childNodes[0].nodeValue = milisec;
};

stopScreenInterval = () => {
    clearInterval(screenInterval);
};

makeScreens = () => {
    screenInterval = setInterval(recognizeScreen, 3000);
};

calculateDelay = (currentTime, result) => {
    spinner.classList.remove("active");
    console.log(currentTime, result);
    let delayTime = currentTime - result;
    if (!isNaN(currentTime) && !isNaN(result) && result && result !== '') {
        hideError(recognizeError);
        delayTime < 0.1 ? delay.childNodes[0].nodeValue = "less than 100 milliseconds" :
            delay.childNodes[0].nodeValue = (delayTime * 1000).toFixed(0) + ' milliseconds';
    } else if (delayTime > 10) {
        spinner.classList.add("active");
    }
    else if (isNaN(result)) {
        showError(recognizeError); //Can use anotherError like showError(anotherError) in any place
    }
    else {
        hideError(recognizeError);
        spinner.classList.add("active");
    }
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
    let currentTime = timer.innerHTML;
    let screenshot = document.getElementById("red5pro-subscriber");
    Tesseract.recognize(screenshot)
        .progress(function (packet) {
            progressUpdate(packet);
            spinner.classList.add("active");
        })
        .then(function (data) {
            progressUpdate({status: 'done', data: data});
            calculateDelay(currentTime, result);
        })
};

chooseServer = () => {
    hideDelayTime();

    clearSub().then(() => {
        showInfoString();
        spinner.classList.add("active");
        spinner.classList.add("center");

        let index = server.selectedIndex;
        let options = server.options;

        serverURL = options[index].value;
        initStream(serverURL);
    });
};