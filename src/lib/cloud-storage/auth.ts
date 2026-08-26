/**
 * Cloud Storage Authentication Utilities
 */

export class CloudStorageAuth {
  /**
   * Generate OAuth URL for Google Drive
   */
  static generateGoogleDriveAuthUrl(clientId: string, redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      access_type: 'offline',
    });

    if (state) {
      params.append('state', state);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Generate OAuth URL for OneDrive
   */
  static generateOneDriveAuthUrl(clientId: string, redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'Files.Read.All',
    });

    if (state) {
      params.append('state', state);
    }

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Generate OAuth URL for iCloud
   */
  static generateICloudAuthUrl(clientId: string, redirectUri: string, state?: string): string {
    // iCloud uses Apple Sign-In
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'cloudkit',
    });

    if (state) {
      params.append('state', state);
    }

    return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token (Google Drive)
   */
  static async exchangeGoogleDriveToken(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    code: string
  ): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange Google Drive token: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Exchange authorization code for access token (OneDrive)
   */
  static async exchangeOneDriveToken(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    code: string
  ): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange OneDrive token: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Exchange authorization code for access token (iCloud)
   */
  static async exchangeICloudToken(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    code: string
  ): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
    // iCloud uses Apple Sign-In flow
    const response = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange iCloud token: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Refresh access token (Google Drive)
   */
  static async refreshGoogleDriveToken(
    clientId: string,
    clientSecret: string,
    refreshToken: string
  ): Promise<{ access_token: string; expires_in?: number }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh Google Drive token: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Refresh access token (OneDrive)
   */
  static async refreshOneDriveToken(
    clientId: string,
    clientSecret: string,
    refreshToken: string
  ): Promise<{ access_token: string; expires_in?: number }> {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh OneDrive token: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Refresh access token (iCloud)
   */
  static async refreshICloudToken(
    clientId: string,
    clientSecret: string,
    refreshToken: string
  ): Promise<{ access_token: string; expires_in?: number }> {
    // iCloud uses Apple Sign-In refresh flow
    const response = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh iCloud token: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Validate if a token is still valid
   */
  static async validateToken(token: string, platform: string): Promise<boolean> {
    try {
      let url = '';
      switch (platform) {
        case 'google_drive':
          url = 'https://www.googleapis.com/oauth2/v1/tokeninfo';
          break;
        case 'onedrive':
          url = 'https://graph.microsoft.com/v1.0/me';
          break;
        case 'icloud':
          url = 'https://api.icloud.com/drive';
          break;
        default:
          return false;
      }

      const headers: HeadersInit = {
        Authorization: `Bearer ${token}`,
      };

      if (platform === 'icloud') {
        headers['X-Apple-Client'] = 'iCloudDrive';
      }

      const response = await fetch(url, { headers });

      return response.ok;
    } catch (error) {
      console.error(`Token validation failed for ${platform}:`, error);
      return false;
    }
  }
}