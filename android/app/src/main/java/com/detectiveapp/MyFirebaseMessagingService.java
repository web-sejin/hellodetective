package com.detectiveapp; // 실제 패키지 이름으로 변경하세요

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        // 여기에 메시지 처리 로직을 추가할 수 있습니다
    }

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        // 새 토큰 생성 시 처리 로직
    }
}