import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
    fontFamily: "Helvetica",
  },

  // Certificate border and background
  certificateContainer: {
    border: "6px solid #1e40af",
    borderRadius: 8,
    padding: 35,
    height: "100%",
    backgroundColor: "#fefefe",
    position: "relative",
    minHeight: 500,
  },

  // Header section
  header: {
    textAlign: "center",
    marginBottom: 25,
  },

  mainTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 8,
    letterSpacing: 1.5,
  },

  subtitle: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 4,
  },

  // Certificate body
  certificateBody: {
    textAlign: "center",
    marginBottom: 30,
  },

  presentedTo: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 15,
  },

  recipientName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 20,
    textDecoration: "underline",
    textDecorationColor: "#1e40af",
    textTransform: "capitalize",
  },

  certificateText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 1.5,
    marginBottom: 25,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  // Statistics section
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 30,
    padding: 16,
    borderRadius: 6,
    border: "1px solid #e2e8f0",
  },

  statItem: {
    textAlign: "center",
    flex: 1,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 10,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Footer section
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: 15,
    borderTop: "1px solid #e2e8f0",
  },

  footerItem: {
    textAlign: "center",
    flex: 1,
  },

  footerTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },

  footerText: {
    fontSize: 10,
    color: "#6b7280",
  },

  // Watermark/Logo area
  logoContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    opacity: 0.1,
  },

  // Certificate ID
  certificateId: {
    position: "absolute",
    top: 15,
    right: 20,
    fontSize: 9,
    color: "#9ca3af",
  },

  // Company Logo
  companyLogo: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 80,
    height: 80,
    objectFit: "contain",
  },
});

const Certificate = ({
  userName,
  totalAmount,
  totalDonations,
  supportedProjects,
  userDonations,
  issueDate,
  companyLogo,
}) => {
  // Generate a simple certificate ID
  const certificateId = `CERT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Get most supported category
  const categories = userDonations
    .map((d) => d.project?.category)
    .filter(Boolean);
  const categoryCount = categories.reduce((acc, cat) => {
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  let topCategory = "Research";
  if (Object.keys(categoryCount).length > 0) {
    topCategory = Object.keys(categoryCount).reduce((a, b) =>
      categoryCount[a] > categoryCount[b] ? a : b
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        <View style={styles.certificateContainer}>
          {/* Company Logo or Fallback */}
          <Image
            src={
              companyLogo ||
              "https://www.impactofresearch.fund/researchbayanihan_logo.png"
            }
            style={styles.companyLogo}
          />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.mainTitle}>CERTIFICATE OF APPRECIATION</Text>
            <Text style={styles.subtitle}>ResearchBayanihan</Text>
            <Text style={styles.subtitle}>
              Supporting Innovation & Discovery
            </Text>
          </View>

          {/* Certificate Body */}
          <View style={styles.certificateBody}>
            <Text style={styles.presentedTo}>
              This certificate is proudly presented to
            </Text>

            <Text style={styles.recipientName}>
              {userName || "Valued Contributor"}
            </Text>

            <Text style={styles.certificateText}>
              In recognition of your generous contribution to advancing research
              and innovation. Your support helps drive groundbreaking
              discoveries. Thank you for being a champion of scientific progress
              and for believing in the power of research to change the world.
            </Text>
          </View>

          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                P{Number(totalAmount || 0).toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Total Donated</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Number(totalDonations || 0)}
              </Text>
              <Text style={styles.statLabel}>Donations Made</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Number(supportedProjects || 0)}
              </Text>
              <Text style={styles.statLabel}>Projects Supported</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerItem}>
              <Text style={styles.footerTitle}>Date Issued</Text>
              <Text style={styles.footerText}>
                {issueDate ||
                  new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
              </Text>
            </View>

            <View style={styles.footerItem}>
              <Text style={styles.footerTitle}>Platform</Text>
              <Text style={styles.footerText}>ResearchBayanihan</Text>
            </View>

            <View style={styles.footerItem}>
              <Text style={styles.footerTitle}>Status</Text>
              <Text style={styles.footerText}>Verified Contributor</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default Certificate;
