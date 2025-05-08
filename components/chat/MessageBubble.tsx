import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { Check, CheckCheck } from 'lucide-react-native';
import { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
}

export default function MessageBubble({ message, isUser }: MessageBubbleProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <View style={[
      styles.container, 
      isUser ? styles.userContainer : styles.otherContainer
    ]}>
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.otherBubble
      ]}>
        <Text style={[
          styles.text,
          isUser ? styles.userText : styles.otherText
        ]}>
          {message.text}
        </Text>
      </View>
      
      <View style={[
        styles.timeRow,
        isUser ? styles.userTimeRow : styles.otherTimeRow
      ]}>
        <Text style={styles.time}>{formatTime(message.timestamp)}</Text>
        
        {isUser && (
          <View style={styles.statusContainer}>
            {message.status === 'sent' ? (
              <Check size={12} color={colors.textLight} />
            ) : (
              <CheckCheck size={12} color={message.status === 'read' ? colors.primary : colors.textLight} />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.light,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: colors.white,
  },
  otherText: {
    color: colors.text,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  userTimeRow: {
    justifyContent: 'flex-end',
  },
  otherTimeRow: {
    justifyContent: 'flex-start',
  },
  time: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: colors.textLight,
  },
  statusContainer: {
    marginLeft: 4,
  },
});