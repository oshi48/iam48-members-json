const fs = require("fs");
const axios = require("axios");

const URL = process.env.URL;
const KEY = process.env.KEY;
const filePath = "members.json";

const countResults = (results) => {
  return results.reduce((counts, item) => {
    const action = item.action;
    counts[action] = (counts[action] || 0) + 1;
    return counts;
  }, {});
};

const main = async () => {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    const perChunk = 10;
    const membersArrays = JSON.parse(data).reduce((all, one, i) => {
      const ch = Math.floor(i / perChunk);
      all[ch] = [].concat(all[ch] || [], one);
      return all;
    }, []);
    let results = [];

    for (let idx = 0; idx < membersArrays.length; idx++) {
      console.log(`# ${idx + 1} : START`);
      const membersArray = membersArrays[idx];
      const payload = {
        table: "members",
        method: "upsertMany",
        data: null,
        options: {
          condition_column: "id",
          data_list: membersArray.map((member) => {
            console.log("member:", member?.codeName);
            return {
              id: member?.id,
              code_name: member?.codeName,
              display_name: member?.displayName,
              display_name_en: member?.displayNameEn,
              subtitle: member?.subtitle,
              subtitle_en: member?.subtitleEn,
              profile_image_url: member?.profileImageUrl,
              cover_image_url: member?.coverImageUrl,
              caption: member?.caption,
              formal_display_name: member?.formalDisplayName,
              city: member?.city,
              city_en: member?.cityEn,
              country: member?.country,
              country_en: member?.countryEn,
              brand: member?.brand,
              hashtags: JSON.stringify(member?.hashtags),
              birthdate: member?.birthdate,
              graduated_at: member?.graduatedAt,
            };
          }),
        },
      };
      const headers = {
        "Content-Type": "application/json",
        "x-api-key": KEY,
      };

      try {
        const res = await axios.post(URL, payload, { headers });
        const cnt = countResults(res.data.result.data);
        console.log(`# ${idx + 1} : ${JSON.stringify(cnt)}\n`);
        results.push(cnt);
      } catch (err) {
        console.error("Error:", err.message);
        continue;
      }
    }
    const totalUpdate =
      results.reduce((sum, result) => sum + result?.update, 0) || 0;
    const totalCreate =
      results.reduce((sum, result) => sum + result?.create, 0) || 0;
    console.log(`Total update: ${totalUpdate}`);
    console.log(`Total create: ${totalCreate}`);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

main();
