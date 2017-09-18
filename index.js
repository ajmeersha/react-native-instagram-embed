/**
 * Instagram Embed component for React Native
 * https://github.com/GaborWnuk
 * @flow
 */

import React, { PureComponent } from 'react';
import { View, Image, Text } from 'react-native';

import styles from './index-styles';

export default class InstagramEmbed extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      response: null,
      height: 240,
      width: 320,
      avatar: null,
      likes: 0,
      comments: 0,
      thumbnail: null,
    };
  }

  _onLayout = layout => {
    this.setState({
      height: layout.nativeEvent.layout.height,
      width: layout.nativeEvent.layout.width,
    });
  };

  /*
   * This is fairly experimental and probably not the best way to supplement
   * existing API (official) data with missing properties we need.
   */
  _fetchComplementaryData = url => {
    let regex = /\/p\/([a-zA-Z0-9]+)/g;
    let match = regex.exec(url);

    const id = match[1];

    if (!id) {
      return;
    }

    console.log(`https://www.instagram.com/p/${id}/embed/captioned/`);
    fetch(`https://www.instagram.com/p/${id}/embed/captioned/`)
      .then(response => response.text())
      .then(responseText => {
        let avatarRegex = /class\=\"ehAvatar\"\s+src=\"([a-zA-Z0-9\-\\\:\/\.\_]+)\"/g;
        let avatarMatch = avatarRegex.exec(responseText);

        let likesRegex = /span\s+class\=\"espMetricTextCollapsible\"><\/span>([0-9\,\.km]+)<span\s+class\=\"espMetricTextCollapsible\">\s+like/g;
        let likesMatch = likesRegex.exec(responseText);

        let commentsRegex = /span\s+class\=\"espMetricTextCollapsible\"><\/span>([0-9\,\.km]+)<span\s+class\=\"espMetricTextCollapsible\">\s+comment/g;
        let commentsMatch = commentsRegex.exec(responseText);

        let thumbnailRegex = /class\=\"efImage\"\s+src=\"([a-zA-Z0-9\-\\\:\/\.\_]+)\"/g;
        let thumbnailMatch = thumbnailRegex.exec(responseText);

        console.log(thumbnailMatch);

        this.setState({
          thumbnail: thumbnailMatch[1],
          avatar: avatarMatch[1],
          likes: likesMatch[1],
          comments: commentsMatch[1],
        });
      })
      .catch(error => {});
  };

  componentDidMount = () => {
    const { url } = this.props;
    fetch(`https://api.instagram.com/oembed/?url=${url}`)
      .then(response => response.json())
      .then(responseJson => {
        this._fetchComplementaryData(url);
        this.setState({ response: responseJson });
      })
      .catch(error => {
        this.setState({ response: null });
      });
  };

  render(): JSX.JSXElement {
    const { style } = this.props;
    const {
      response,
      height,
      width,
      avatar,
      likes,
      comments,
      thumbnail,
    } = this.state;

    if (!response) {
      return <View style={[{ width: 0, height: 0 }, style]} />;
    }

    return (
      <View
        style={[
          styles.container,
          style,
          {
            height: height,
          },
        ]}
      >
        <View onLayout={this._onLayout}>
          <View style={styles.headerContainer}>
            {avatar && (
              <Image
                source={{
                  uri: avatar,
                }}
                style={styles.avatar}
              />
            )}
            <Text style={styles.author}>{response.author_name}</Text>
          </View>
          {!!thumbnail && (
            <Image
              source={{ uri: thumbnail }}
              style={{
                height:
                  response.thumbnail_height * width / response.thumbnail_width,
              }}
            />
          )}
          <View style={{ flexDirection: 'column', margin: 8 }}>
            <View style={styles.statsContainer}>
              <Image
                source={require('./assets/images/icon_likes.png')}
                style={styles.statIcon}
              />
              <Text style={styles.statLabel}>{likes} likes</Text>
              <Image
                source={require('./assets/images/icon_comments.png')}
                style={styles.statIcon}
              />
              <Text style={styles.statLabel}>{comments} comments</Text>
            </View>
            <Text>{response.title}</Text>
          </View>
        </View>
      </View>
    );
  }
}
