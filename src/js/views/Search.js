
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Switch, Route } from 'react-router-dom';
import Header from '../components/Header';
import Icon from '../components/Icon';
import DropdownField from '../components/Fields/DropdownField';
import TrackList from '../components/TrackList';
import ArtistGrid from '../components/ArtistGrid';
import AlbumGrid from '../components/AlbumGrid';
import PlaylistGrid from '../components/PlaylistGrid';
import LazyLoadListener from '../components/LazyLoadListener';
import SearchForm from '../components/Fields/SearchForm';
import URILink from '../components/URILink';
import SearchResults from '../components/SearchResults';
import * as coreActions from '../services/core/actions';
import * as uiActions from '../services/ui/actions';
import * as mopidyActions from '../services/mopidy/actions';
import * as spotifyActions from '../services/spotify/actions';
import {
  titleCase,
  getIndexedRecords,
} from '../util/helpers';
import { sortItems } from '../util/arrays';

class Search extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      type: 'all',
      term: '',
    };
  }

  componentDidMount() {
    this.props.uiActions.setWindowTitle('Search');

    // Auto-focus on the input field
    $(document).find('.search-form input').focus();

    // Listen for a query baked-in to the URL
    // This would be the case when we've clicked from a link elsewhere
    this.digestUri({
      ...this.props,
      term: decodeURIComponent(this.props.term),
    });
  }

  componentDidUpdate = ({
    type: prevType,
    term: prevTerm,
    mopidy_connected: prev_mopidy_connected,
  }) => {
    const {
      type: typeProp,
      term: termProp,
      mopidy_connected,
      uri_schemes_search_enabled,
    } = this.props;
    const { type, term } = this.state;

    if (prevType !== typeProp || prevTerm !== termProp) {
      this.digestUri({ type: typeProp, term: termProp });
    }

    // Services came online
    if (!prev_mopidy_connected && mopidy_connected && uri_schemes_search_enabled) {
      this.search(type, term, 'mopidy');

      if (uri_schemes_search_enabled.includes('spotify:')) {
        this.search(type, term, 'spotify');
      }
    }
  }

  handleSubmit = (term) => {
    const { type } = this.state;
    const { history, term: propTerm } = this.props;
    const encodedTerm = encodeURIComponent(term);

    this.setState(
      { term }, () => {
        // Unchanged term, so this is a forced re-search
        // Often the other search parameters have changed instead, but we can't
        // push a URL change when the term hasn't changed
        if (propTerm === term) {
          this.search();
        } else {
          history.push(`/search/${type}/${encodedTerm}`);
        }
      },
    );
  }

  // Digest the URI query property
  // Triggered when the URL changes
  digestUri(props = this.props) {
    if (props.type && props.term) {
      this.setState({
        type: props.type,
        term: props.term,
      });

      this.search(props.type, props.term);
    } else if (!props.term || props.term == '') {
      this.props.spotifyActions.clearSearchResults();
      this.props.mopidyActions.clearSearchResults();
    }
  }

  search(type = this.state.type, term = this.state.term, provider) {
    this.props.uiActions.setWindowTitle(`Search: ${decodeURIComponent(term)}`);

    if (type && term) {
      if (provider == 'mopidy' || (this.props.mopidy_connected && this.props.uri_schemes_search_enabled)) {
        if (this.props.mopidy_search_results.query === undefined || this.props.mopidy_search_results.query != term) {
          this.props.mopidyActions.clearSearchResults();
          this.props.mopidyActions.getSearchResults(type, term);
        }
      }

      if (provider == 'spotify' || (this.props.mopidy_connected && this.props.uri_schemes_search_enabled && this.props.uri_schemes_search_enabled.includes('spotify:'))) {
        if (this.props.spotify_search_results.query === undefined || this.props.spotify_search_results.query != term) {
          this.props.spotifyActions.clearSearchResults();
          this.props.spotifyActions.getSearchResults(type, term);
        }
      }
    }
  }

  loadMore(type) {
    alert(`load more: ${type}`);
    // this.props.spotifyActions.getURL(this.props['spotify_'+type+'_more'], 'SPOTIFY_SEARCH_RESULTS_LOADED_MORE_'+type.toUpperCase());
  }

  setSort(value) {
    let reverse = false;
    if (this.props.sort == value) reverse = !this.props.sort_reverse;

    const data = {
      search_results_sort_reverse: reverse,
      search_results_sort: value,
    };
    this.props.uiActions.set(data);
  }

  handleSourceChange(value) {
    this.props.uiActions.set({ uri_schemes_search_enabled: value });
    this.props.uiActions.hideContextMenu();
  }

  renderArtists(artists, spotify_search_enabled) {
    const encodedTerm = encodeURIComponent(this.state.term);
    return (
      <div>
        <h4>
          <URILink uri={`iris:search:all:${encodedTerm}`}>
						{`Search `}
          </URILink>
          <Icon type="fontawesome" name="angle-right" />
          {` Artists`}
        </h4>
        <section className="grid-wrapper">
          <ArtistGrid artists={artists} show_source_icon />
          <LazyLoadListener enabled={this.props.artists_more && spotify_search_enabled} loadMore={() => this.loadMore('artists')} />
        </section>
      </div>
    );
  }

  renderAlbums(albums, spotify_search_enabled) {
    const encodedTerm = encodeURIComponent(this.state.term);
    return (
      <div>
        <h4>
          <URILink uri={`iris:search:all:${encodedTerm}`}>
						{`Search `}
          </URILink>
          <Icon type="fontawesome" name="angle-right" />
          {` Albums`}
        </h4>
        <section className="grid-wrapper">
          <AlbumGrid albums={albums} show_source_icon />
          <LazyLoadListener enabled={this.props.albums_more && spotify_search_enabled} loadMore={() => this.loadMore('albums')} />
        </section>
      </div>
    );
  }

  renderPlaylists(playlists, spotify_search_enabled) {
    const encodedTerm = encodeURIComponent(this.state.term);
    return (
      <div>
        <h4>
          <URILink uri={`iris:search:all:${encodedTerm}`}>
						{`Search `}
          </URILink>
          <Icon type="fontawesome" name="angle-right" />
          {` Playlists`}
        </h4>
        <section className="grid-wrapper">
          <PlaylistGrid playlists={playlists} show_source_icon />
          <LazyLoadListener enabled={this.props.playlists_more && spotify_search_enabled} loadMore={() => this.loadMore('playlists')} />
        </section>
      </div>
    );
  }

  renderTracks(tracks, spotify_search_enabled) {
    const encodedTerm = encodeURIComponent(this.state.term);
    return (
      <div>
        <h4>
          <URILink uri={`iris:search:all:${encodedTerm}`}>
						{`Search `}
          </URILink>
          <Icon type="fontawesome" name="angle-right" />
          {` Tracks`}
        </h4>
        <section className="list-wrapper">
          <TrackList tracks={tracks} uri={`iris:search:${this.state.type}:${encodedTerm}`} show_source_icon />
          <LazyLoadListener enabled={this.props.tracks_more && spotify_search_enabled} loadMore={() => this.loadMore('tracks')} />
        </section>
      </div>
    );
  }

  renderAll(artists, albums, playlists, tracks, spotify_search_enabled) {
    const encodedTerm = encodeURIComponent(this.state.term);
    if (artists.length > 0) {
      var artists_section = (
        <section>
          <div className="inner">
            <URILink uri={`iris:search:artist:${encodedTerm}`}>
              <h4>Artists</h4>
            </URILink>
            <ArtistGrid mini show_source_icon artists={artists.slice(0, 6)} />
            {artists.length >= 6 && (
              <URILink uri={`iris:search:artist:${encodedTerm}`} className="button button--default">
							{`All artists (${artists.length})`}
              </URILink>
            )}
          </div>
        </section>
      );
    } else {
      var artists_section = null;
    }

    if (albums.length > 0) {
      var albums_section = (
        <section>
          <div className="inner">
            <URILink uri={`iris:search:album:${encodedTerm}`}>
              <h4>Albums</h4>
            </URILink>
            <AlbumGrid mini show_source_icon albums={albums.slice(0, 6)} />
            {albums.length >= 6 && (
              <URILink uri={`iris:search:album:${encodedTerm}`} className="button button--default">
							{`All albums (${albums.length})`}
              </URILink>
            )}
          </div>
        </section>
      );
    } else {
      var albums_section = null;
    }

    if (playlists.length > 0) {
      var playlists_section = (
        <section>
          <div className="inner">
            <URILink uri={`iris:search:playlist:${encodedTerm}`}>
              <h4>Playlists</h4>
            </URILink>
            <PlaylistGrid mini show_source_icon playlists={playlists.slice(0, 6)} />
            {playlists.length >= 6 && (
              <URILink uri={`iris:search:playlist:${encodedTerm}`} className="button button--default">
							{`All playlists (${playlists.length})`}
              </URILink>
            )}
          </div>
        </section>
      );
    } else {
      var playlists_section = null;
    }

    if (tracks.length > 0) {
      var tracks_section = (
        <section className="list-wrapper">
          <TrackList tracks={tracks} uri={`iris:search:${this.state.type}:${encodedTerm}`} show_source_icon />
          <LazyLoadListener loading={this.props.tracks_more && spotify_search_enabled} loadMore={() => this.loadMore('tracks')} />
        </section>
      );
    } else {
      var tracks_section = null;
    }

    return (
      <div>
        <div className="search-result-sections cf">
          {artists_section}
          {albums_section}
          {playlists_section}
        </div>
        {tracks_section}
      </div>
    );
  }

  render = () => {
    const {
      term,
      type,
    } = this.state;
    const {
      search_settings,
      uri_schemes,
      sort,
      sort_reverse,
      history,
      uri_schemes_priority,
      uri_schemes_search_enabled,
      mopidy_search_results,
      spotify_search_results,
      spotifyActions,
      mopidyActions,
    } = this.props;
    const sort_options = [
      {
        value: 'followers',
        label: 'Popularity',
      },
      {
        value: 'name',
        label: 'Name',
      },
      {
        value: 'artists.name',
        label: 'Artist',
      },
      {
        value: 'duration',
        label: 'Duration',
      },
      {
        value: 'uri',
        label: 'Source',
      },
    ];

    const provider_options = [];
    for (let i = 0; i < uri_schemes.length; i++) {
      provider_options.push({
        value: uri_schemes[i],
        label: titleCase(uri_schemes[i].replace(':', '').replace('+', ' ')),
      });
    }

    const options = (
      <span>
        <DropdownField
          icon="swap_vert"
          name="Sort"
          value={sort}
          valueAsLabel
          options={sort_options}
          selected_icon={sort_reverse ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
          handleChange={(value) => { this.setSort(value); uiActions.hideContextMenu(); }}
        />
        <DropdownField
          icon="cloud"
          name="Sources"
          value={uri_schemes_search_enabled}
          options={provider_options}
          handleChange={(value) => this.handleSourceChange(value)}
          onClose={() => {
            spotifyActions.clearSearchResults();
            mopidyActions.clearSearchResults();
            this.search()
          }}
        />
      </span>
    );

    return (
      <div className="view search-view">
        <Header options={options} uiActions={uiActions}>
          <Icon name="search" type="material" />
        </Header>

        <SearchForm
          history={history}
          term={term}
          onSubmit={(term) => this.handleSubmit(term)}
        />

        <div className="content-wrapper">
          <Switch>

            <Route path="/search/artists/:term">
              <SearchResults type="artists" query={{ term, type }} />
            </Route>

            <Route path="/search/albums/:term">
              <SearchResults type="albums" query={{ term, type }} />
            </Route>

            <Route path="/search/playlists/:term">
              <SearchResults type="playlists" query={{ term, type }} />
            </Route>

            <Route path="/search/tracks/:term">
              <SearchResults type="tracks" query={{ term, type }} />
            </Route>

            <Route path="/search">
              <div className="search-result-sections cf">
                <section className="search-result-sections__item">
                  <div className="inner">
                    <SearchResults type="artists" query={{ term, type }} all />
                  </div>
                </section>
                <section className="search-result-sections__item">
                  <div className="inner">
                    <SearchResults type="albums" query={{ term, type }} all />
                  </div>
                </section>
                <section className="search-result-sections__item">
                  <div className="inner">
                    <SearchResults type="playlists" query={{ term, type }} all />
                  </div>
                </section>
              </div>
              <SearchResults type="tracks" query={{ term, type }} all />
            </Route>

          </Switch>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  type: ownProps.match.params.type,
  term: ownProps.match.params.term,
  mopidy_connected: state.mopidy.connected,
  albums: (state.core.albums ? state.core.albums : []),
  artists: (state.core.artists ? state.core.artists : []),
  playlists: (state.core.playlists ? state.core.playlists : []),
  tracks: (state.core.tracks ? state.core.tracks : []),
  uri_schemes_search_enabled: (state.ui.uri_schemes_search_enabled ? state.ui.uri_schemes_search_enabled : []),
  uri_schemes_priority: (state.ui.uri_schemes_priority ? state.ui.uri_schemes_priority : []),
  uri_schemes: (state.mopidy.uri_schemes ? state.mopidy.uri_schemes : []),
  mopidy_search_results: (state.mopidy.search_results ? state.mopidy.search_results : {}),
  spotify_search_results: (state.spotify.search_results ? state.spotify.search_results : {}),
  sort: (state.ui.search_results_sort ? state.ui.search_results_sort : 'followers.total'),
  sort_reverse: (!!state.ui.search_results_sort_reverse),
});

const mapDispatchToProps = (dispatch) => ({
  coreActions: bindActionCreators(coreActions, dispatch),
  uiActions: bindActionCreators(uiActions, dispatch),
  mopidyActions: bindActionCreators(mopidyActions, dispatch),
  spotifyActions: bindActionCreators(spotifyActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Search);
