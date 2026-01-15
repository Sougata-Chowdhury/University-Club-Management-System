import api from './api';

export const dashboardService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      console.log('Fetching dashboard statistics...');
      
      // Fetch all required data in parallel
      const [clubsResponse, myClubsResponse, eventsResponse] = await Promise.all([
        api.get('/clubs').catch((error) => {
          console.error('Error fetching clubs:', error);
          return { data: [] };
        }),
        api.get('/clubs/my-clubs').catch((error) => {
          console.error('Error fetching my clubs:', error);
          return { data: { createdClubs: [], joinedClubs: [] } };
        }),
        api.get('/events/registered').catch((error) => {
          console.error('Error fetching registered events:', error);
          return { data: [] };
        })
      ]);

      console.log('Clubs response:', clubsResponse.data);
      console.log('My clubs response:', myClubsResponse.data);
      console.log('Events response:', eventsResponse.data);

      // Extract the correct data
      const availableClubs = Array.isArray(clubsResponse.data) ? clubsResponse.data.length : 0;
      const clubsOwned = myClubsResponse.data.createdClubs ? myClubsResponse.data.createdClubs.length : 0;
      const registeredEvents = Array.isArray(eventsResponse.data) ? eventsResponse.data.length : 0;

      console.log('Calculated stats:', {
        availableClubs,
        clubsOwned,
        registeredEvents
      });

      return {
        availableClubs,
        clubsOwned,
        registeredEvents,
        totalEvents: 0 // Could add this endpoint later
      };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard statistics');
    }
  },

  // Get recent activity (could be expanded later)
  getRecentActivity: async () => {
    try {
      const response = await api.get('/activity/recent');
      return response.data;
    } catch (error) {
      // Return empty array if endpoint doesn't exist yet
      return [];
    }
  }
};
